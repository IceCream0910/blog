import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { calculateLayout } from '../utils/layout';
import { ItemNode } from './ItemNode';

interface Props {
    items?: Array<{
        id: string;
        title: string;
    }>;
}

export const InfiniteCanvas: React.FC<Props> = ({ items = [] }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPointerPosition = useRef({ x: 0, y: 0 });
    const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const isDragging = useRef(false);
    const dragDistance = useRef(0);
    const DRAG_THRESHOLD = 3; // 드래그로 인정할 최소 이동 거리

    const MIN_ZOOM = 0.8;
    const MAX_ZOOM = 1.5;
    let lastDistance = 0;

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 150,
        overscan: 5,
    });

    // 초기 viewport 크기 설정
    const [viewport, setViewport] = useState({ width: 1000, height: 1000 });

    // viewport 크기 업데이트를 위한 effect
    useEffect(() => {
        setViewport({
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, []);

    const isItemInViewport = useCallback((posX: number, posY: number) => {
        const currentX = posX - x.get();
        const currentY = posY - y.get();

        return (
            currentX >= -150 &&
            currentX <= viewport.width + 150 &&
            currentY >= -150 &&
            currentY <= viewport.height + 150
        );
    }, [x, y, viewport]);

    const itemsWithLayout = useMemo(() => {
        const layouts: ItemLayout[] = [];
        return items.map((item, index) => {
            const layout = calculateLayout(item.title, index, layouts);
            layouts.push(layout);
            return {
                ...item,
                layout
            };
        });
    }, [items]);

    useEffect(() => {
        const calculateCanvasSize = () => {
            if (!items?.length || !containerRef.current) {
                setBounds({
                    left: -viewport.width,
                    right: viewport.width,
                    top: -viewport.height,
                    bottom: viewport.height
                });
                return;
            }

            const currentScale = scale.get();
            const maxRadius = 500; // calculateLayout에서 사용하는 최대 반경
            const padding = Math.max(viewport.width, viewport.height) * 0.25;

            setBounds({
                left: -(maxRadius + padding) * currentScale,
                right: (maxRadius + padding) * currentScale,
                top: -(maxRadius + padding) * currentScale,
                bottom: (maxRadius + padding) * currentScale
            });
        };

        calculateCanvasSize();

        const unsubscribeScale = scale.onChange(calculateCanvasSize);
        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight
            });
            window.requestAnimationFrame(calculateCanvasSize);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            unsubscribeScale();
            window.removeEventListener('resize', handleResize);
        };
    }, [items, viewport]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button === 2) return; // 우클릭 무시

        isDragging.current = true;
        dragDistance.current = 0;
        lastPointerPosition.current = { x: e.clientX, y: e.clientY };
        containerRef.current?.style.setProperty('cursor', 'grabbing');
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const dx = e.clientX - lastPointerPosition.current.x;
        const dy = e.clientY - lastPointerPosition.current.y;
        dragDistance.current += Math.sqrt(dx * dx + dy * dy);

        const currentScale = scale.get();
        const newX = x.get() + dx;
        const newY = y.get() + dy;

        // 현재 스케일을 고려하여 canvas bound 설정
        x.set(Math.max(bounds.left / currentScale, Math.min(bounds.right / currentScale, newX)));
        y.set(Math.max(bounds.top / currentScale, Math.min(bounds.bottom / currentScale, newY)));

        lastPointerPosition.current = { x: e.clientX, y: e.clientY };

        // 드래그 중에는 클릭 이벤트 방지
        if (dragDistance.current > DRAG_THRESHOLD) {
            e.preventDefault();
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const target = e.target as HTMLElement;
        target.releasePointerCapture(e.pointerId);

        // 드래그 거리가 임계값보다 작은 경우에만 클릭 이벤트 허용
        if (dragDistance.current < DRAG_THRESHOLD && e.button !== 2) {
            const gridItem = target.closest('.grid-item');
            if (gridItem) {
                const navigationEvent = new CustomEvent('navigate', {
                    detail: { id: gridItem.getAttribute('data-id') }
                });
                gridItem.dispatchEvent(navigationEvent);
            }
        }

        isDragging.current = false;
        containerRef.current?.style.setProperty('cursor', 'grab');
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale.get() + delta));
        scale.set(newScale);
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );

            const delta = (distance - lastDistance) * 0.01;
            const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale.get() + delta));
            scale.set(newScale);
            lastDistance = distance;
        }
    };

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        element.addEventListener('wheel', handleWheel, { passive: false });
        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);

        return () => {
            element.removeEventListener('wheel', handleWheel);
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    console.log(itemsWithLayout)

    return (
        <div
            ref={containerRef}
            className="w-full h-screen overflow-hidden relative cursor-grab select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={e => e.preventDefault()}
            style={{ touchAction: 'none' }}
        >

            <motion.div
                style={{
                    x,
                    y,
                    scale,
                }}
                className="absolute origin-center"
            >
                {itemsWithLayout.length > 0 ? (
                    itemsWithLayout.map((item) => (
                        isItemInViewport(item.layout.x, item.layout.y) && (
                            <ItemNode
                                key={item.id}
                                {...item}
                            />
                        )
                    ))
                ) : (
                    <div className="text-gray-500 text-center p-4">
                        No items to display
                    </div>
                )}
            </motion.div>
        </div>
    );
};

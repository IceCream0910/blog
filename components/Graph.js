"use client";
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';

const Graph = ({ data }) => {
    const svgRef = useRef(null);
    const gRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // SVG 설정
        const width = window.innerWidth;
        const height = window.innerHeight * 0.8;
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // 기존 요소 제거
        svg.selectAll('*').remove();

        // 메인 그룹 요소
        const g = svg.append('g');
        gRef.current = g;

        // Force 시뮬레이션 설정
        const simulation = d3.forceSimulation(data.nodes)
            .force('charge', d3.forceManyBody()
                .strength(-300)
                .distanceMax(300))
            .force('link', d3.forceLink(data.links)
                .id(d => d.id)
                .distance(100))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1))
            .force('collision', d3.forceCollide().radius(40))
            .alphaDecay(0.1)
            .velocityDecay(0.2);

        // 링크 그리기
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1);

        // 애니메이션용 이동 점 컨테이너
        const particleGroup = g.append('g')
            .attr('class', 'particles');

        // 노드 그룹 생성
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(data.nodes)
            .join('g')
            .attr('class', 'node')
            .on('click', (event, d) => {
                if (d.type !== 'page') return;
                router.push(`/${d.id}`);
                event.stopPropagation();
            })
            .on('mouseover', (event, d) => highlightConnected(d, true))
            .on('mouseout', (event, d) => highlightConnected(d, false))

        // 노드 원 그리기
        node.append('circle')
            .attr('r', d => d.type === 'collection_view' ? 6 : 3)
            .attr('fill', d => d.type === 'collection_view' ? '#ff6b6b' : '#4dabf7')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        // 노드 레이블 그리기
        node.append('text')
            .text(d => d.title)
            .attr('dx', d => (d.type === 'collection_view' ? 6 : 3) + 5)
            .attr('dy', 5)
            .attr('font-size', '11px')
            .attr('fill', 'var(--foreground)');

        // 줌 기능 설정
        const zoom = d3.zoom()
            .scaleExtent([0.4, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);

                // 줌 레벨에 따른 요소 크기 조절
                const scale = event.transform.k;

                // 노드 크기 조절
                node.selectAll('circle')
                    .attr('r', d => {
                        const baseSize = d.type === 'collection_view' ? 6 : 3;
                        return scale < 0.6 ? baseSize * 0.5 : baseSize / Math.sqrt(scale);
                    });

                // 레이블 표시/숨김 및 크기 조절
                node.selectAll('text')
                    .style('display', scale < 0.6 ? 'none' : 'block')
                    .attr('font-size', `${12 / Math.sqrt(scale)}px`)
                    .attr('dx', d => {
                        const baseSize = d.type === 'collection_view' ? 6 : 3;
                        return (baseSize / Math.sqrt(scale)) + 5;
                    });

                // 선 두께 조절
                link.attr('stroke-width', 1 / Math.sqrt(scale));
            });

        svg.call(zoom);

        // 초기 카메라 위치 설정
        const initialTransform = d3.zoomIdentity.translate(width / 50, height / 4).scale(0.8);
        svg.call(zoom.transform, initialTransform);

        // 시뮬레이션 틱 이벤트 수정
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // 연결된 노드와 링크 강조 함수
        function highlightConnected(d, on) {
            const connectedNodes = new Set([d.id]);
            const connectedLinks = new Set();

            data.links.forEach(link => {
                if (link.source.id === d.id || link.target.id === d.id) {
                    connectedNodes.add(link.source.id);
                    connectedNodes.add(link.target.id);
                    connectedLinks.add(link);
                }
            });

            node.selectAll('circle')
                .transition()
                .duration(200)
                .attr('fill', node => {
                    const baseColor = node.type === 'collection_view' ? '#ff6b6b' : '#4dabf7';
                    if (!on) return baseColor;
                    return connectedNodes.has(node.id) ? d3.color(baseColor).brighter(0.5) : d3.color(baseColor).darker(0.8);
                })
                .attr('stroke', node => connectedNodes.has(node.id) ? '#fff' : '#ccc')
                .attr('stroke-width', node => connectedNodes.has(node.id) ? 2 : 1)
                .style('opacity', node => on && !connectedNodes.has(node.id) ? 0.3 : 1);

            node.selectAll('text')
                .transition()
                .duration(200)
                .style('opacity', node => on && !connectedNodes.has(node.id) ? 0.3 : 1);

            link
                .transition()
                .duration(200)
                .attr('stroke', l => connectedLinks.has(l) ? '#666' : '#999')
                .attr('stroke-opacity', l => {
                    if (!on) return 0.3;
                    return connectedLinks.has(l) ? 0.8 : 0.1;
                })
                .attr('stroke-width', l => connectedLinks.has(l) ? 2 : 1);
        }

        // 드래그 이벤트 핸들러
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // 윈도우 리사이즈 이벤트 핸들러
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight * 0.8;
            svg.attr('width', newWidth).attr('height', newHeight);
            simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
            simulation.alpha(0.3).restart();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            simulation.stop();
            window.removeEventListener('resize', handleResize);
        };
    }, [data]);

    return (
        <div className="w-full h-screen">
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100vh',
                }}
            />
        </div>
    );
};

export default Graph;

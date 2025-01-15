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
            .force('collision', d3.forceCollide().radius(50))
            .alphaDecay(0.1)
            .velocityDecay(0.2);

        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .join('line')
            .attr('stroke', 'var(--tag-text)')
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1);

        const particleGroup = g.append('g')
            .attr('class', 'particles');

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

        node.append('circle')
            .attr('r', d => d.type === 'collection_view' ? 8 : 4)
            .attr('fill', d => d.type === 'collection_view' ? '#ef5959' : 'var(--primary)')
            .attr('stroke', 'var(--primary-light)')
            .attr('stroke-width', 1);

        node.append('text')
            .text(d => d.title)
            .attr('dx', d => (d.type === 'collection_view' ? 8 : 4) + 5)
            .attr('dy', 5)
            .attr('font-size', '11px')
            .attr('fill', 'var(--foreground)');

        const zoom = d3.zoom()
            .scaleExtent([0.4, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                const scale = event.transform.k;

                node.selectAll('circle')
                    .attr('r', d => d.type === 'collection_view' ? 8 / Math.sqrt(scale) : 4 / Math.sqrt(scale))
                    .attr('stroke-width', 1 / Math.sqrt(scale));

                node.selectAll('text')
                    .style('display', scale < 0.6 ? 'none' : 'block')
                    .attr('font-size', `${12 / Math.sqrt(scale)}px`)
                    .attr('dx', d => {
                        const baseSize = d.type === 'collection_view' ? 8 : 4;
                        return (baseSize / Math.sqrt(scale)) + 5;
                    });

                link.attr('stroke-width', 1 / Math.sqrt(scale))
                    .attr('stroke-opacity', 0.3 / Math.sqrt(scale));
            });

        svg.call(zoom);

        // 초기 카메라 위치 설정
        const initialTransform = d3.zoomIdentity.translate(width / 30, height / 8).scale(0.8);
        svg.call(zoom.transform, initialTransform);

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

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

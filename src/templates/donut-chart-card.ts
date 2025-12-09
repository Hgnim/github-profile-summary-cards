import {Card} from './card';
import * as d3 from 'd3';
import {PieArcDatum} from 'd3-shape';
import {Theme} from '../const/theme';

export function createDonutChartCard(
    title: string,
    data: {name: string; value: number; color: string}[],
    theme: Theme
) {
    const pie = d3.pie<{name: string; value: number; color: string}>().value(function (d) {
        return d.value;
    });
    const pieData = pie(data);
    
    // 🔥 动态计算高度：每个语言占 25px，最小高度 200px
    const labelHeight = 14;
    const minHeight = 200;
    const dynamicHeight = Math.max(minHeight, 60 + data.length * labelHeight * 1.8);
    
    const card = new Card(title, 340, dynamicHeight, theme);  // ← 使用动态高度

    const margin = 10;
    // 重新计算半径，确保饼图不会太大
    const maxRadius = (Math.min(card.width, minHeight) - 2 * margin - card.yPadding) / 2;
    const radius = Math.min(maxRadius, dynamicHeight / 2 - margin);

    const arc = d3
        .arc<PieArcDatum<{name: string; value: number; color: string}>>()
        .outerRadius(radius - 10)
        .innerRadius(radius / 2);

    const svg = card.getSVG();
    
    // 🔥 重新计算标签起始位置（基于顶部，而不是固定位置）
    const labelStartY = card.yPadding + 20;
    
    // draw language labels
    const panel = svg.append('g').attr('transform', `translate(${card.xPadding + margin}, ${labelStartY})`);
    
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('rect')
        .attr('y', (d, i) => i * labelHeight * 1.5)  // ← 相对位置
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', d => d.data.color)
        .attr('stroke', `${theme.background}`)
        .style('stroke-width', '1px');

    // set language text
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('text')
        .text(d => d.data.name)
        .attr('x', labelHeight * 1.2)
        .attr('y', (d, i) => i * labelHeight * 1.5 + labelHeight * 0.8)  // ← 垂直居中
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);

    // 🔥 重新计算饼图位置（垂直居中）
    const pieCenterY = dynamicHeight / 2 - card.yPadding / 2;
    
    // draw pie chart
    const g = svg
        .append('g')
        .attr(
            'transform',
            `translate(${card.width - radius - margin - card.xPadding}, ${pieCenterY})`
        )
        .selectAll('.arc')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'arc');

    g.append('path')
        .attr('d', arc)
        .style('fill', d => d.data.color)
        .attr('stroke', `${theme.background}`)
        .style('stroke-width', '2px');
        
    return card.toString();
}
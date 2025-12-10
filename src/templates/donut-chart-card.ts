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
    
    // 🔥 计算总值用于百分比
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    
    // 动态高度（每个语言占25px，最小200px）
    const labelHeight = 14;
    const minHeight = 200;
    const dynamicHeight = Math.max(minHeight, 60 + data.length * labelHeight * 1.8);
    
    const card = new Card(title, 340, dynamicHeight, theme);

    const margin = 10;
    const maxRadius = (Math.min(card.width, minHeight) - 2 * margin - card.yPadding) / 2;
    const radius = Math.min(maxRadius, dynamicHeight / 2 - margin);

    const arc = d3
        .arc<PieArcDatum<{name: string; value: number; color: string}>>()
        .outerRadius(radius - 10)
        .innerRadius(radius / 2);

    const svg = card.getSVG();
    const labelStartY = card.yPadding + 20;
    
    const panel = svg.append('g').attr('transform', `translate(${card.xPadding + margin}, ${labelStartY})`);
    
    // draw color rects
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('rect')
        .attr('y', (d, i) => i * labelHeight * 1.5)
        .attr('width', labelHeight)
        .attr('height', labelHeight)
        .attr('fill', d => d.data.color)
        .attr('stroke', `${theme.background}`)
        .style('stroke-width', '1px');

    // 🔥 修改文本：名称 + 百分比
    panel
        .selectAll(null)
        .data(pieData)
        .enter()
        .append('text')
        .text(d => {
            const percentage = ((d.data.value / totalValue) * 100).toFixed(4);
            return `${d.data.name} (${percentage}%)`;
        })
        .attr('x', labelHeight * 1.2)
        .attr('y', (d, i) => i * labelHeight * 1.5 + labelHeight * 0.8)
        .style('fill', theme.text)
        .style('font-size', `${labelHeight}px`);
    
    // 🔥 如果文本过长，截断处理（可选）
    // .each(function(d) {
    //     const text = d3.select(this);
    //     const fullText = text.text();
    //     if (fullText.length > 25) {
    //         text.text(fullText.substring(0, 22) + '...');
    //     }
    // });

    // draw pie chart
    const pieCenterY = dynamicHeight / 2 - card.yPadding / 2;
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
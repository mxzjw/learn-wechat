/**
 * 体重趋势平滑折线图：基于 Canvas 2D，使用单调三次插值保证曲线平滑且不会过冲。
 * series: [{ label: '11-01', value: 4.2 }]（按时间升序）
 */

function monotoneTangents(xs, ys) {
    const n = xs.length;
    if (n < 2) {
        return [];
    }
    const slope = [];
    for (let i = 0; i < n - 1; i += 1) {
        const h = xs[i + 1] - xs[i];
        slope.push(h === 0 ? 0 : (ys[i + 1] - ys[i]) / h);
    }
    const m = [slope[0]];
    for (let i = 1; i < n - 1; i += 1) {
        if (slope[i - 1] * slope[i] <= 0) {
            m.push(0);
        } else {
            m.push((slope[i - 1] + slope[i]) / 2);
        }
    }
    m.push(slope[n - 2]);
    for (let i = 0; i < n - 1; i += 1) {
        if (slope[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
        }
        const a = m[i] / slope[i];
        const b = m[i + 1] / slope[i];
        const sum = a * a + b * b;
        if (sum > 9) {
            const t = 3 / Math.sqrt(sum);
            m[i] = t * a * slope[i];
            m[i + 1] = t * b * slope[i];
        }
    }
    return m;
}

function drawWeightChart(ctx, width, height, series) {
    ctx.clearRect(0, 0, width, height);
    if (!series || !series.length) {
        return false;
    }

    const padTop = 32;
    const padRight = 20;
    const padBottom = 28;
    const padLeft = 44;
    const plotW = Math.max(width - padLeft - padRight, 10);
    const plotH = Math.max(height - padTop - padBottom, 10);

    const values = series.map(function (item) {
        return item.value;
    });
    let minValue = Math.min.apply(null, values);
    let maxValue = Math.max.apply(null, values);
    if (maxValue - minValue < 0.4) {
        const mid = (maxValue + minValue) / 2;
        minValue = mid - 0.25;
        maxValue = mid + 0.25;
    }
    const padding = (maxValue - minValue) * 0.2;
    minValue -= padding;
    maxValue += padding;
    const span = maxValue - minValue || 1;

    const xs = series.map(function (item, index) {
        if (series.length === 1) {
            return padLeft + plotW / 2;
        }
        return padLeft + (plotW * index) / (series.length - 1);
    });
    const ys = values.map(function (value) {
        return padTop + plotH - ((value - minValue) / span) * plotH;
    });

    const baseY = padTop + plotH;

    ctx.save();

    // 横向网格 + 纵轴刻度
    const tickCount = 3;
    for (let i = 0; i < tickCount; i += 1) {
        const ratio = tickCount === 1 ? 0 : i / (tickCount - 1);
        const y = padTop + plotH * ratio;
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.strokeStyle = '#f0e6da';
        ctx.lineWidth = 1;
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#b7a99b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText((maxValue - span * ratio).toFixed(1), padLeft - 8, y);
    }

    function buildPath() {
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        if (series.length === 1) {
            return;
        }
        const tangents = monotoneTangents(xs, ys);
        for (let i = 0; i < xs.length - 1; i += 1) {
            const h = xs[i + 1] - xs[i];
            const c1x = xs[i] + h / 3;
            const c1y = ys[i] + (tangents[i] * h) / 3;
            const c2x = xs[i + 1] - h / 3;
            const c2y = ys[i + 1] - (tangents[i + 1] * h) / 3;
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, xs[i + 1], ys[i + 1]);
        }
    }

    // 曲线下方的渐变填充
    if (series.length > 1) {
        buildPath();
        ctx.lineTo(xs[xs.length - 1], baseY);
        ctx.lineTo(xs[0], baseY);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padTop, 0, baseY);
        gradient.addColorStop(0, 'rgba(232, 130, 58, 0.26)');
        gradient.addColorStop(1, 'rgba(232, 130, 58, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // 平滑曲线
    buildPath();
    ctx.strokeStyle = '#e8823a';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // 数据点
    const lastIndex = series.length - 1;
    for (let i = 0; i < xs.length; i += 1) {
        ctx.beginPath();
        ctx.arc(xs[i], ys[i], i === lastIndex ? 4.4 : 3, 0, Math.PI * 2);
        ctx.fillStyle = i === lastIndex ? '#e8823a' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e8823a';
        ctx.stroke();
    }

    // 最新一条数值气泡
    const label = values[lastIndex].toFixed(1) + 'kg';
    ctx.font = 'bold 11px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const bubbleW = textWidth + 16;
    const bubbleH = 22;
    let bubbleX = xs[lastIndex] - bubbleW / 2;
    if (bubbleX < padLeft - 6) {
        bubbleX = padLeft - 6;
    }
    if (bubbleX + bubbleW > width - 4) {
        bubbleX = width - 4 - bubbleW;
    }
    let bubbleY = ys[lastIndex] - bubbleH - 12;
    if (bubbleY < 2) {
        bubbleY = ys[lastIndex] + 14;
    }
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(bubbleX + radius, bubbleY);
    ctx.lineTo(bubbleX + bubbleW - radius, bubbleY);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + radius);
    ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - radius);
    ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - radius, bubbleY + bubbleH);
    ctx.lineTo(bubbleX + radius, bubbleY + bubbleH);
    ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - radius);
    ctx.lineTo(bubbleX, bubbleY + radius);
    ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + radius, bubbleY);
    ctx.closePath();
    ctx.fillStyle = '#e8823a';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2 + 0.5);

    // 横轴日期
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#b7a99b';
    ctx.textBaseline = 'top';
    const labelY = baseY + 8;
    if (series.length === 1) {
        ctx.textAlign = 'center';
        ctx.fillText(series[0].label, xs[0], labelY);
    } else {
        ctx.textAlign = 'left';
        ctx.fillText(series[0].label, xs[0], labelY);
        ctx.textAlign = 'right';
        ctx.fillText(series[lastIndex].label, xs[lastIndex], labelY);
        if (series.length >= 4) {
            const midIndex = Math.floor(lastIndex / 2);
            ctx.textAlign = 'center';
            ctx.fillText(series[midIndex].label, xs[midIndex], labelY);
        }
    }

    ctx.restore();
    return true;
}

module.exports = {
    drawWeightChart: drawWeightChart,
};

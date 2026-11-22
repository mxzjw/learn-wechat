function pad(value) {
    return value < 10 ? '0' + value : '' + value;
}

function toDateString(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function today() {
    return toDateString(new Date());
}

function parseDate(value) {
    if (!value) {
        return null;
    }
    const parts = String(value).split('-');
    if (parts.length !== 3) {
        return null;
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) {
        return null;
    }
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
}

function diffDays(target) {
    const date = parseDate(target);
    if (!date) {
        return null;
    }
    const now = parseDate(today());
    return Math.round((date.getTime() - now.getTime()) / 86400000);
}

function addMonths(value, months) {
    const base = parseDate(value) || parseDate(today());
    const day = base.getDate();
    const shifted = new Date(base.getFullYear(), base.getMonth() + months, 1);
    const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
    shifted.setDate(Math.min(day, lastDay));
    return toDateString(shifted);
}

function formatMonthDay(value) {
    const date = parseDate(value);
    if (!date) {
        return '';
    }
    return date.getMonth() + 1 + '月' + date.getDate() + '日';
}

function formatShort(value) {
    const date = parseDate(value);
    if (!date) {
        return '';
    }
    return pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function ageText(birthday) {
    const date = parseDate(birthday);
    if (!date) {
        return '';
    }
    const now = new Date();
    let months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (now.getDate() < date.getDate()) {
        months -= 1;
    }
    if (months < 0) {
        months = 0;
    }
    const years = Math.floor(months / 12);
    const restMonths = months % 12;
    if (years <= 0) {
        return restMonths + '个月';
    }
    if (restMonths === 0) {
        return years + '岁';
    }
    return years + '岁' + restMonths + '个月';
}

function countdownText(days) {
    if (days === null) {
        return '未设置';
    }
    if (days < 0) {
        return '已逾期 ' + Math.abs(days) + ' 天';
    }
    if (days === 0) {
        return '就是今天';
    }
    return '还有 ' + days + ' 天';
}

function countdownLevel(days) {
    if (days === null) {
        return 'muted';
    }
    if (days < 0) {
        return 'danger';
    }
    if (days <= 7) {
        return 'warn';
    }
    return 'ok';
}

module.exports = {
    pad: pad,
    today: today,
    toDateString: toDateString,
    parseDate: parseDate,
    diffDays: diffDays,
    addMonths: addMonths,
    formatMonthDay: formatMonthDay,
    formatShort: formatShort,
    ageText: ageText,
    countdownText: countdownText,
    countdownLevel: countdownLevel,
};

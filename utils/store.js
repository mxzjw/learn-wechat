/**
 * 数据层：当前使用小程序本地存储实现。
 * 所有方法均返回 Promise，页面不关心底层实现；
 * 后续接入云数据库时，只需在这一层把读写替换为云端请求，页面无需改动。
 */

const CATS_KEY = 'cat_health_cats_v1';
const WEIGHTS_KEY = 'cat_health_weights_v1';

function readList(key) {
    try {
        const value = wx.getStorageSync(key);
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function writeList(key, list) {
    try {
        wx.setStorageSync(key, list);
        return true;
    } catch (error) {
        return false;
    }
}

function makeId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function listCats() {
    const cats = readList(CATS_KEY).slice();
    cats.sort(function (a, b) {
        return (a.createdAt || 0) - (b.createdAt || 0);
    });
    return Promise.resolve(clone(cats));
}

function getCat(id) {
    const cats = readList(CATS_KEY);
    for (let i = 0; i < cats.length; i += 1) {
        if (cats[i].id === id) {
            return Promise.resolve(clone(cats[i]));
        }
    }
    return Promise.resolve(null);
}

function saveCat(payload) {
    const cats = readList(CATS_KEY);
    const now = Date.now();
    let saved = null;
    let index = -1;
    for (let i = 0; i < cats.length; i += 1) {
        if (cats[i].id === payload.id) {
            index = i;
            break;
        }
    }
    if (index >= 0) {
        saved = Object.assign({}, cats[index], payload, { updatedAt: now });
        cats[index] = saved;
    } else {
        saved = Object.assign({ id: makeId('cat'), createdAt: now, updatedAt: now }, payload);
        cats.push(saved);
    }
    writeList(CATS_KEY, cats);
    return Promise.resolve(clone(saved));
}

function removeCat(id) {
    const cats = readList(CATS_KEY).filter(function (item) {
        return item.id !== id;
    });
    writeList(CATS_KEY, cats);
    const weights = readList(WEIGHTS_KEY).filter(function (item) {
        return item.catId !== id;
    });
    writeList(WEIGHTS_KEY, weights);
    return Promise.resolve(true);
}

function sortWeights(list) {
    return list.sort(function (a, b) {
        if (a.date === b.date) {
            return (a.createdAt || 0) - (b.createdAt || 0);
        }
        return a.date < b.date ? -1 : 1;
    });
}

function listWeights(catId) {
    const list = readList(WEIGHTS_KEY).filter(function (item) {
        return item.catId === catId;
    });
    return Promise.resolve(clone(sortWeights(list)));
}

function listAllWeights() {
    return Promise.resolve(clone(sortWeights(readList(WEIGHTS_KEY).slice())));
}

function addWeight(payload) {
    const weights = readList(WEIGHTS_KEY);
    const record = {
        id: makeId('wt'),
        catId: payload.catId,
        date: payload.date,
        weight: Number(payload.weight),
        note: payload.note || '',
        createdAt: Date.now(),
    };
    weights.push(record);
    writeList(WEIGHTS_KEY, weights);
    return Promise.resolve(clone(record));
}

function removeWeight(id) {
    const weights = readList(WEIGHTS_KEY).filter(function (item) {
        return item.id !== id;
    });
    writeList(WEIGHTS_KEY, weights);
    return Promise.resolve(true);
}

module.exports = {
    listCats: listCats,
    getCat: getCat,
    saveCat: saveCat,
    removeCat: removeCat,
    listWeights: listWeights,
    listAllWeights: listAllWeights,
    addWeight: addWeight,
    removeWeight: removeWeight,
};

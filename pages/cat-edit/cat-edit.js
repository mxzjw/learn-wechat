const store = require('../../utils/store');
const dateUtil = require('../../utils/date');

const EMOJI_OPTIONS = ['🐱', '🐈', '😺', '🐈‍⬛', '🐾'];
const BREED_OPTIONS = ['中华田园猫', '英短蓝白', '美短起司', '布偶', '暹罗', '橘猫', '银渐层', '加菲'];

Page({
    data: {
        id: '',
        isEdit: false,
        name: '',
        breed: '',
        birthday: '',
        birthdayPicker: '',
        dewormNext: '',
        vaccineNext: '',
        dewormPicker: '',
        vaccinePicker: '',
        avatar: '',
        emoji: '🐱',
        ageHint: '选择生日后可自动计算月龄',
        emojiOptions: EMOJI_OPTIONS,
        breedOptions: BREED_OPTIONS,
        today: dateUtil.today(),
        saving: false,
    },

    onLoad(options) {
        const today = dateUtil.today();
        if (options && options.id) {
            this.setData({ id: options.id, isEdit: true });
            wx.setNavigationBarTitle({ title: '编辑档案' });
            store.getCat(options.id).then((cat) => {
                if (!cat) {
                    wx.showToast({ title: '猫咪不存在', icon: 'none' });
                    return;
                }
                this.setData({
                    name: cat.name || '',
                    breed: cat.breed || '',
                    birthday: cat.birthday || '',
                    birthdayPicker: cat.birthday || today,
                    dewormNext: cat.dewormNext || '',
                    dewormPicker: cat.dewormNext || today,
                    vaccineNext: cat.vaccineNext || '',
                    vaccinePicker: cat.vaccineNext || today,
                    avatar: cat.avatar || '',
                    emoji: cat.emoji || '🐱',
                    ageHint: cat.birthday ? '当前月龄 ' + dateUtil.ageText(cat.birthday) : '选择生日后可自动计算月龄',
                });
            });
        } else {
            wx.setNavigationBarTitle({ title: '添加猫咪' });
            this.setData({
                birthdayPicker: today,
                dewormPicker: today,
                vaccinePicker: today,
            });
        }
    },

    onNameInput(event) {
        this.setData({ name: event.detail.value });
    },

    onBreedInput(event) {
        this.setData({ breed: event.detail.value });
    },

    onPickBreed(event) {
        this.setData({ breed: event.currentTarget.dataset.breed });
    },

    onPickEmoji(event) {
        this.setData({ emoji: event.currentTarget.dataset.emoji });
    },

    onBirthdayChange(event) {
        const value = event.detail.value;
        this.setData({
            birthday: value,
            birthdayPicker: value,
            ageHint: '当前月龄 ' + dateUtil.ageText(value),
        });
    },

    onDewormChange(event) {
        this.setData({ dewormNext: event.detail.value, dewormPicker: event.detail.value });
    },

    onVaccineChange(event) {
        this.setData({ vaccineNext: event.detail.value, vaccinePicker: event.detail.value });
    },

    onQuickNext(event) {
        const dataset = event.currentTarget.dataset;
        const months = Number(dataset.months);
        const value = dateUtil.addMonths(dateUtil.today(), months);
        if (dataset.type === 'deworm') {
            this.setData({ dewormNext: value, dewormPicker: value });
        } else {
            this.setData({ vaccineNext: value, vaccinePicker: value });
        }
    },

    onClearNext(event) {
        const type = event.currentTarget.dataset.type;
        if (type === 'deworm') {
            this.setData({ dewormNext: '' });
        } else {
            this.setData({ vaccineNext: '' });
        }
    },

    onChooseAvatar() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sizeType: ['compressed'],
            success: (res) => {
                const tempFilePath = res.tempFiles && res.tempFiles[0] ? res.tempFiles[0].tempFilePath : '';
                if (!tempFilePath) {
                    return;
                }
                this.persistAvatar(tempFilePath);
            },
            fail: () => {
                wx.showToast({ title: '未能选择图片，可继续使用表情头像', icon: 'none' });
            },
        });
    },

    persistAvatar(tempFilePath) {
        try {
            wx.getFileSystemManager().saveFile({
                tempFilePath: tempFilePath,
                success: (res) => {
                    this.setData({ avatar: res.savedFilePath });
                },
                fail: () => {
                    this.setData({ avatar: tempFilePath });
                },
            });
        } catch (error) {
            this.setData({ avatar: tempFilePath });
        }
    },

    onSave() {
        if (this.data.saving) {
            return;
        }
        const name = (this.data.name || '').trim();
        if (!name) {
            wx.showToast({ title: '请先填写猫咪名字', icon: 'none' });
            return;
        }
        this.setData({ saving: true });
        const payload = {
            id: this.data.id || undefined,
            name: name,
            breed: (this.data.breed || '').trim(),
            birthday: this.data.birthday || '',
            dewormNext: this.data.dewormNext || '',
            vaccineNext: this.data.vaccineNext || '',
            avatar: this.data.avatar || '',
            emoji: this.data.emoji || '🐱',
        };
        store
            .saveCat(payload)
            .then((cat) => {
                this.setData({ saving: false });
                wx.showToast({ title: this.data.isEdit ? '已保存' : '档案已创建', icon: 'success' });
                setTimeout(() => {
                    if (this.data.isEdit) {
                        wx.navigateBack();
                    } else {
                        wx.redirectTo({ url: '/pages/cat-detail/cat-detail?id=' + cat.id });
                    }
                }, 400);
            })
            .catch(() => {
                this.setData({ saving: false });
                wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            });
    },

    onDelete() {
        wx.showModal({
            title: '删除档案',
            content: '将同时删除这只猫咪的全部体重记录，且无法恢复。',
            confirmText: '删除',
            confirmColor: '#c2433a',
            success: (res) => {
                if (!res.confirm) {
                    return;
                }
                store.removeCat(this.data.id).then(() => {
                    wx.showToast({ title: '已删除', icon: 'success' });
                    setTimeout(() => {
                        wx.reLaunch({ url: '/pages/index/index' });
                    }, 400);
                });
            },
        });
    },
});

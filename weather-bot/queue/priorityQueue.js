class PriorityQueue {
    constructor() {
        this.items = []
        this.id = 0
        this.availableModes = ["highest", "lowest", "oldest", "newest"]
    }

    enqueue(item, priority = 0) {
        let normalizedPriority = Number(priority)

        if (Number.isNaN(normalizedPriority)) {
            normalizedPriority = 0
        }

        const obj = {
            item,
            priority: normalizedPriority,
            id: this.id
        }

        this.id++
        this.items.push(obj)

        return obj
    }

    dequeue(mode = "highest") {
        const index = this.getIndexByMode(mode)

        if (index === -1) {
            return null
        }

        const deleted = this.items.splice(index, 1)
        return deleted[0].item
    }

    peek(mode = "highest") {
        const index = this.getIndexByMode(mode)

        if (index === -1) {
            return null
        }

        return this.items[index].item
    }

    size() {
        return this.items.length
    }

    isEmpty() {
        return this.items.length === 0
    }

    clear() {
        this.items = []
        this.id = 0
    }

    getIndexByMode(mode) {
        if (this.items.length === 0) {
            return -1
        }

        if (!mode || !this.availableModes.includes(mode)) {
            mode = "highest"
        }

        let selectedIndex = 0

        for (let index = 1; index < this.items.length; index += 1) {
            const currentItem = this.items[index]
            const selectedItem = this.items[selectedIndex]

            if (mode === "highest") {
                if (currentItem.priority > selectedItem.priority) {
                    selectedIndex = index
                }
            } else if (mode === "lowest") {
                if (currentItem.priority < selectedItem.priority) {
                    selectedIndex = index
                }
            } else if (mode === "oldest") {
                if (currentItem.id < selectedItem.id) {
                    selectedIndex = index
                }
            } else if (mode === "newest") {
                if (currentItem.id > selectedItem.id) {
                    selectedIndex = index
                }
            }
        }

        return selectedIndex
    }
}

module.exports = PriorityQueue;

class PriorityQueue {
    constructor() {
        this.items = []
        this.id = 0
    }

    enqueue(item, priority = 0) {
        const obj = {
            item,
            priority,
            id: this.id
        }

        this.id++
        this.items.push(obj)

        return obj
    }

    dequeue(mode = "highest") {
        let index = this.getIndexByMode(mode)

        if (index === -1) {
            return null
        }

        let deleted = this.items.splice(index, 1)
        return deleted[0].item
    }

    peek(mode = "highest") {
        let index = this.getIndexByMode(mode)

        if (index === -1) {
            return null
        }

        return this.items[index].item
    }

    size() {
        return this.items.length
    }

    isEmpty() {
        return this.items.length == 0
    }

    clear() {
        this.items = []
    }

    getIndexByMode(mode) {
        if (this.items.length === 0) {
            return -1
        }

        if (!mode) {
            mode = "highest"
        }

        let selectedIndex = 0

        for (let index = 1; index < this.items.length; index += 1) {
            let a = this.items[index]
            let b = this.items[selectedIndex]

            if (mode === "highest") {
                if (a.priority >= b.priority) {
                    selectedIndex = index
                }
            }

            if (mode === "lowest") {
                if (a.priority <= b.priority) {
                    selectedIndex = index
                }
            }

            if (mode === "oldest") {
                if (a.id < b.id) {
                    selectedIndex = index
                }
            }

            if (mode === "newest") {
                if (a.id > b.id) {
                    selectedIndex = index
                }
            }
        }

        return selectedIndex
    }
}

module.exports = PriorityQueue;

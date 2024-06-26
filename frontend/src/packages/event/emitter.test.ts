import EventEmitter from "./emitter";

test('emitter', () => {
    const em = new EventEmitter();
    em.on('test', (test) => {
        console.log("test 111")
    })
    em.on('test', (test) => {
        console.log("test 222")
    })
    em.on('test', (test) => {
        console.log("test 333")
    })
    em.once("test", () => {
        console.log("test once")
    })
    em.emit('test')
    em.emit('test')
    em.emit('test')
});

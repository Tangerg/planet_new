import {debounce} from "./function";

test("debounce", () => {
    const fn = (value: number) => {
        console.log(value)
    }
    const fn2 = debounce(fn, 50)
    for (let i = 0; i < 100; i++) {
        fn2(i)
    }
})
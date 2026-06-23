import { test } from "vitest";
import { Repeat, RepeatMode } from "./repeat";

test("repeat", async () => {
  const repeat = new Repeat();
  console.log(repeat.current);
  console.log(repeat.next());
  console.log(repeat.current);
  console.log(repeat.next());
  console.log(repeat.next());
  console.log(repeat.next());
  console.log(repeat.next());
  console.log(repeat.next());
  console.log(repeat.next());
  console.log(repeat.current === RepeatMode.OFF);
});

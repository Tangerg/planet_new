# Radix → Base UI 渐进迁移

把前端 headless 组件库从 Radix 逐步换成 [Base UI](https://base-ui.com)(`@base-ui/react`)。**两套库过渡期并存**,一次迁一个 `ui/components/controls/` 封装,迁完即删对应的 `@radix-ui/*` 包。

为什么可行:所有 Radix 都封装在 `controls/` 后面,消费方只依赖封装的公开 API。只要封装的 props 形状不变,换底层库对上层透明 —— 所以能一个一个来,不必大爆炸。

## 约定(由 Switch pilot 确立)

- **封装公开 API 不变**:消费方零改动才是"渐进"的前提。
- **按子路径导入**利于 tree-shaking:`import { Switch } from "@base-ui/react/switch"`。
- **状态样式属性**:Radix `[data-state="checked"]` → Base UI 语义化属性 `[data-checked]` / `[data-unchecked]` / `[data-disabled]` 等。就近 CSS 里的 `data-state` 选择器要逐一改写。
- **子部件状态从 root 驱动**:拿不准某个 part 是否带状态属性时,用 `.root[data-checked] .part { … }` 而非依赖 part 自身属性(见 Switch thumb)。
- **非 button 的 root**:Base UI 某些 root 不是 `<button>`,固定宽高要补 `inline-block`(否则 inline 元素忽略 w/h)。
- **组合**:Radix `asChild`/`Slot` → Base UI `render` prop;通用 `Button`(Radix `Slot`)→ Base UI 的 `useRender` hook。
- **删包时机**:某组件的**最后一个消费方**迁移后,`yarn remove @radix-ui/react-xxx`(否则 knip 报未用依赖)。
- **分块**:`vite.config.ts` 加了 `vendor-baseui` chunk。
- **每步**:`yarn run check` 全绿 + 实机 smoke,单独 commit,勾掉清单。

## 清单(顺序:低风险 → 高风险)

- [x] **Switch**(pilot)—— `data-state`→`data-checked`,已删 `@radix-ui/react-switch`
- [x] **Toggle** —— `pressed`/`onPressedChange` 同名,按下态本就内联(无 CSS 耦合),已删 `@radix-ui/react-toggle`
- [ ] ToggleGroup
- [ ] Tooltip
- [ ] HoverCard → **PreviewCard**(消费方:`TextReveal`、`VolumeControl`)
- [ ] Slider
- [ ] Sheet(Dialog)—— 焦点/Portal 敏感,登录面板要重点 smoke
- [ ] Menu(DropdownMenu)—— 键盘/子菜单/Escape 焦点返回要重点 smoke
- [ ] **Button**(Slot/asChild → `useRender`)—— **放最后**,牵动全仓 ~15 处 `asChild`

迁完全部即可移除最后的 `@radix-ui/*` 与 `vendor-radix` chunk。

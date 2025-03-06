import "@/lib/styles/global.scss";
import "@/lib/styles/fonts.scss";
import { mount } from "svelte";
import Content from "./Options.svelte";

mount(Content, {
  target: document.getElementById("app")!,
});

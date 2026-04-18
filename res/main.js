import { App } from "./components/App.js";
import { mount } from "./core/render.js";
import {Translator} from "./core/translator";

const root = document.body;

mount(root, App);
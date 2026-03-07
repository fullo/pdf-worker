declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// Polyfill type for Map.prototype.getOrInsertComputed (TC39 upsert proposal)
interface Map<K, V> {
    getOrInsertComputed(key: K, callbackFn: (key: K) => V): V;
}

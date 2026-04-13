export function mount(root, view) {
    const { effect } = Reactor;

    effect(() => {
        root.patch(view());
    });
}
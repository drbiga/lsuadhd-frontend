export enum Item {
    // SESSION_TOKEN = 'ADHD::SessionToken',
    SESSION_OBJ = 'ADHD::Session'
}

export function getLocalStorage(item: Item): string | null {
    return localStorage.getItem(item.toString());
}

export function setLocalStorage(item: Item, value: string) {
    localStorage.setItem(item.toString(), value);
}

export function removeLocalStorage(item: Item) {
    localStorage.removeItem(item.toString());
}

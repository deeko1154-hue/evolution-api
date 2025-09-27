import { readFileSync, writeFileSync, existsSync } from 'fs';

export default function useSingleFileAuthState(file) {
    let state = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : {};

    const saveState = () => writeFileSync(file, JSON.stringify(state, null, 2));

    return { state, saveState };
}

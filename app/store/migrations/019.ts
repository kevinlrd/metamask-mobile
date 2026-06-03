/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export default function migrate(state) {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}

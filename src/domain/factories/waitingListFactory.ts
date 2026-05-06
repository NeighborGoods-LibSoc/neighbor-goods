import {
  Thing,
  WaitingList,
  FirstComeFirstServeWaitingList,
  NullWaitingList,
  WaitingListType,
} from "..";

export class WaitingListFactory {
  static createNewList(
    library: { waitingListType: WaitingListType },
    item: Thing,
  ): WaitingList {
    switch (library.waitingListType) {
      case WaitingListType.NONE:
        return new NullWaitingList({ item });
      case WaitingListType.FIRST_COME_FIRST_SERVE:
        return new FirstComeFirstServeWaitingList({ item });
      default:
        throw new Error(
          `Can't handle library type ${library.waitingListType}`,
        );
    }
  }
}

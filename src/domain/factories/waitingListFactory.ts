import { Thing } from "../entities/thing";
import { WaitingList } from "../entities/waiting_lists/waitingList";
import { FirstComeFirstServeWaitingList } from "../entities/waiting_lists/firstComeFirstServeWaitingList";
import { NullWaitingList } from "../entities/waiting_lists/nullWaitingList";
import { WaitingListType } from "../valueItems/waitingListTypes";

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

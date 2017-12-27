import { Subject } from 'rxjs/Subject'

import 'rxjs/add/operator/filter'

export class ReduxInput extends Subject {
  ofType (type) {
    return this.filter(action => action.type === type)
  }
}

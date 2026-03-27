# DataService CRUD Template (WEC)

## Service 範本

```ts
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfig, DataService } from '@wec/core';

export interface ItemModel {
  id: string;
  name: string;
  enabled: number;
}

@Injectable({ providedIn: 'root' })
export class ItemService extends DataService {
  constructor(injector: Injector) {
    super(injector);
  }

  protected get app(): string {
    return AppConfig.get('app');
  }

  loadData(params?: Record<string, unknown>): Observable<ItemModel[]> {
    return this.post('api/item/query', params ?? {}, true);
  }

  createItem(payload: ItemModel): Observable<ItemModel> {
    return this.post('api/item/create', payload, true);
  }

  updateItem(id: string, payload: ItemModel): Observable<ItemModel> {
    return this.post(`api/item/${id}/update`, payload, true);
  }

  deleteItem(id: string): Observable<void> {
    return this.post(`api/item/${id}/delete`, { id }, true);
  }

  getItemById(id: string): Observable<ItemModel> {
    return this.post(`api/item/${id}`, { id }, true);
  }
}
```

## Component 端用法（摘要）

```ts
this.itemService
  .loadData(this.formGroup.value)
  .pipe(catchError(() => of([])))
  .subscribe((rows) => (this.rowData = rows));
```

# AG Grid Page Template (WEC)

## HTML 範本

```html
<div class="fx-column fx-fill small">
  <div class="fx-row middle small">
    <button nbButton status="primary" (click)="reload()">重新整理</button>
  </div>

  <ag-grid-angular class="ag-theme-balham" [gridOptions]="gridOptions" [rowData]="rowData" style="height: 420px; width: 100%;"></ag-grid-angular>
</div>
```

## TypeScript 範本

```ts
import { Component, Injector, OnInit } from '@angular/core';
import { AgGridOptions } from '@wec/components';

@Component({
  selector: 'app-grid-page',
  templateUrl: './grid-page.component.html'
})
export class GridPageComponent implements OnInit {
  rowData: any[] = [];

  gridOptions = new AgGridOptions(
    {
      columnDefs: [
        { headerName: '名稱', field: 'name', editable: true, cellEditor: 'textEditor' },
        {
          headerName: '狀態',
          field: 'enabled',
          editable: true,
          cellEditor: 'booleanEditor',
          cellEditorParams: {
            items: [
              { value: 1, label: '啟用' },
              { value: 0, label: '停用' }
            ]
          }
        },
        {
          headerName: '操作',
          cellRenderer: 'actionRenderer',
          cellRendererParams: {
            actions: [{ icon: 'edit', status: 'primary', title: 'edit', data: 'edit' }],
            clicked: (row: any, action: any): void => {
              if (action.data === 'edit') {
                this.edit(row);
              }
            }
          }
        }
      ],
      rowSelection: { mode: 'multiRow' },
      popupParent: document.body,
      domLayout: 'autoHeight'
    },
    {
      autoSizeAllColumns: true,
      allowAppendRow: true,
      suppressExport: true
    }
  );

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.rowData = [];
  }

  edit(row: any): void {
    // TODO
  }
}
```

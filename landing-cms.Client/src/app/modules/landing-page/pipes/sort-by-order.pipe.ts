import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortByOrder',
  standalone: true
})
export class SortByOrderPipe implements PipeTransform {
  transform(items: any[] | null): any[] {
    if (!items) return [];

    return [...items].sort((a, b) => {
      return a.order - b.order;
    });
  }
}

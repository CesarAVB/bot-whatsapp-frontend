import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../../services/http-base';
import { DashboardMetricasResponse } from '../../shared/models/dashboard-metricas-response';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpBaseService);

  buscarMetricas(): Observable<DashboardMetricasResponse> {
    return this.http.get<DashboardMetricasResponse>('/dashboard/metricas');
  }
}

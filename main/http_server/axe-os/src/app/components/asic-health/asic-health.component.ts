import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, timer, switchMap, shareReplay, first, takeUntil } from 'rxjs';
import { SystemApiService } from 'src/app/services/system.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SystemInfo as ISystemInfo } from 'src/app/generated';

type AsicHealth = {
  asicIndex: number;
  healthPercentage: number;
  status: 'good' | 'warning' | 'error';
  errorPercentage: number;
  hashrate: number;
};

@Component({
  selector: 'app-asic-health',
  templateUrl: './asic-health.component.html',
  styleUrls: ['./asic-health.component.scss']
})
export class AsicHealthComponent implements OnInit, OnDestroy {
  public info$!: Observable<ISystemInfo>;
  public asicHealthList: AsicHealth[] = [];
  public showChart: boolean[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private systemService: SystemApiService,
    private loadingService: LoadingService,
  ) {
    this.info$ = timer(0, 5000).pipe(
      switchMap(() => this.systemService.getInfo()),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  ngOnInit() {
    this.loadingService.loading$.next(true);

    this.info$
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe({
        next: (info: ISystemInfo) => {
          this.updateAsicHealth(info);
          this.loadingService.loading$.next(false);
        }
      });

    this.info$
      .pipe(takeUntil(this.destroy$))
      .subscribe((info: ISystemInfo) => {
        this.updateAsicHealth(info);
        // Keep showChart state, but resize if needed
        if (this.showChart.length !== this.asicHealthList.length) {
          this.showChart = new Array(this.asicHealthList.length).fill(false);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChart(index: number) {
    this.showChart[index] = !this.showChart[index];
  }

  getChartData(asic: AsicHealth) {
    return {
      labels: ['Health', 'Error'],
      datasets: [
        {
          data: [asic.healthPercentage, asic.errorPercentage],
          backgroundColor: [this.getStatusColor(asic.status), '#FF6384'],
          hoverBackgroundColor: [this.getStatusColor(asic.status), '#FF6384']
        }
      ]
    };
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'good': return 'pi pi-check-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'error': return 'pi pi-times-circle';
      default: return 'pi pi-question-circle';
    }
  }

  private updateAsicHealth(info: ISystemInfo) {
    this.asicHealthList = [];

    if (!info.hashrateMonitor || !info.hashrateMonitor.asics) {
      return;
    }

    // Calculate health for each ASIC
    info.hashrateMonitor.asics.forEach((asic, index) => {
      const errorPercentage = asic.errorCount && asic.total 
        ? (asic.errorCount / asic.total) * 100 
        : 0;

      // Health percentage: 100% - error percentage, capped at 0-100
      const healthPercentage = Math.max(0, 100 - errorPercentage);

      // Determine status based on health and error percentage
      let status: 'good' | 'warning' | 'error' = 'good';
      if (errorPercentage > 5) {
        status = 'error';
      } else if (errorPercentage > 1) {
        status = 'warning';
      }

      // Also factor in overall health
      if (info.power_fault || info.overheat_mode) {
        status = 'error';
      } else if (info.miningPaused) {
        status = 'warning';
      }

      this.asicHealthList.push({
        asicIndex: index,
        healthPercentage: Math.round(healthPercentage),
        status,
        errorPercentage: Math.round(errorPercentage * 100) / 100,
        hashrate: asic.total || 0
      });
    });
  }
}

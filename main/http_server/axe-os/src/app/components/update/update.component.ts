import { Component, ViewChild } from '@angular/core';
import { Observable, switchMap, shareReplay, map, timer, distinctUntilChanged } from 'rxjs';
import { HttpErrorResponse, HttpEventType, HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FileUploadHandlerEvent, FileUpload } from 'primeng/fileupload';
import { GithubUpdateService } from 'src/app/services/github-update.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SystemApiService } from 'src/app/services/system.service';
import { LocalStorageService } from 'src/app/local-storage.service';
import { ModalComponent } from '../modal/modal.component';

const IGNORE_RELEASE_CHECK_WARNING = 'IGNORE_RELEASE_CHECK_WARNING';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent {

  public firmwareUpdateProgress: number | null = null;
  public websiteUpdateProgress: number | null = null;

  public checkLatestRelease: boolean = false;
  public latestRelease$: Observable<any>;

  public info$: Observable<any>;

  // Auto-update properties
  public showPrereleases: boolean = false;
  public selectedRelease: any = null;
  public availableReleases$: Observable<any[]>;
  public autoUpdateInProgress: boolean = false;

  @ViewChild('firmwareUpload') firmwareUpload!: FileUpload;
  @ViewChild('websiteUpload') websiteUpload!: FileUpload;

  @ViewChild(ModalComponent) modalComponent!: ModalComponent;

  constructor(
    private systemService: SystemApiService,
    private toastrService: ToastrService,
    private loadingService: LoadingService,
    private githubUpdateService: GithubUpdateService,
    private localStorageService: LocalStorageService,
    private httpClient: HttpClient,
  ) {
    this.latestRelease$ = this.githubUpdateService.getReleases().pipe(map(releases => {
      return releases[0];
    }));

    this.availableReleases$ = this.githubUpdateService.getReleases(true); // Include prereleases by default for auto-update

    this.info$ = timer(0, 5000).pipe(
      switchMap(() => this.systemService.getInfo()),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      shareReplay({ refCount: true, bufferSize: 1 })
    );
  }

  otaUpdate(event: FileUploadHandlerEvent) {
    const file = event.files[0];
    this.firmwareUpload.clear(); // clear the file upload component

    if (file.name != 'esp-miner.bin') {
      this.toastrService.error('Incorrect file, looking for esp-miner.bin.');
      return;
    }

    this.systemService.performOTAUpdate(file)
      .pipe(this.loadingService.lockUIUntilComplete())
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.firmwareUpdateProgress = Math.round((event.loaded / (event.total as number)) * 100);
          } else if (event.type === HttpEventType.Response) {
            if (event.ok) {
              this.toastrService.success('Firmware updated. Device has been successfully restarted.');

            } else {
              this.toastrService.error(event.statusText);
            }
          }
          else if (event instanceof HttpErrorResponse)
          {
            this.toastrService.error(event.error);
          }
        },
        error: (err) => {
          this.toastrService.error(err.error);
        },
        complete: () => {
          this.firmwareUpdateProgress = null;
        }
      });
  }

  otaWWWUpdate(event: FileUploadHandlerEvent) {
    const file = event.files[0];
    this.websiteUpload.clear(); // clear the file upload component

    if (file.name != 'www.bin') {
      this.toastrService.error('Incorrect file, looking for www.bin.');
      return;
    }

    this.systemService.performWWWOTAUpdate(file)
      .pipe(
        this.loadingService.lockUIUntilComplete(),
      ).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.websiteUpdateProgress = Math.round((event.loaded / (event.total as number)) * 100);
          } else if (event.type === HttpEventType.Response) {
            if (event.ok) {
              this.toastrService.success('AxeOS updated. The page will reload in a few seconds.');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              this.toastrService.error(event.statusText);
            }
          }
          else if (event instanceof HttpErrorResponse)
          {
            const errorMessage = event.error?.message || event.message || 'Unknown error occurred';
            this.toastrService.error(errorMessage);
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
          this.toastrService.error(errorMessage);
        },
        complete: () => {
          this.websiteUpdateProgress = null;
        }
      });
  }

  // https://gist.github.com/elfefe/ef08e583e276e7617cd316ba2382fc40
  public simpleMarkdownParser(markdown: string): string {
    const toHTML = markdown
      .replace(/^#{1,6}\s+(.+)$/gim, '<h4 class="mt-2">$1</h4>') // Headlines
      .replace(/\*\*(.+?)\*\*|__(.+?)__/gim, '<b>$1</b>') // Bold text
      .replace(/\*(.+?)\*|_(.+?)_/gim, '<i>$1</i>') // Italic text
      .replace(/\[(.*?)\]\((.*?)\s?(?:"(.*?)")?\)/gm, '<a href="$2" class="underline text-white" target="_blank">$1</a>') // Markdown links
      .replace(/(https?:\/\/github\.com\/.+\/(.+[^\s])+)/gim, (match, p1, p2) => `<a href="${p1}" target="_blank">${match.includes('/pull/') ? '#' : ''}${p2}</a>`) // Regular links
      .replace(/@([^\s]+)/gim, ' <a href="https://github.com/$1" target="_blank">@$1</a> ') // Username links
      .replace(/^\s*[-+*]\s?(.+)$/gim, '<li>$1</li>') // Unordered list
      .replace(/`([^`]+)`/gim, '<code class="surface-100">$1</code>') // Code
      .replace(/\r\n\r\n/gim, '<br>'); // Breaks

    return toHTML.trim();
  }

  public handleReleaseCheck(): void {
    if (this.localStorageService.getBool(IGNORE_RELEASE_CHECK_WARNING)) {
      this.checkLatestRelease = true;
    } else {
      this.modalComponent.isVisible = true;
    }
  }

  public continueReleaseCheck(skipWarning: boolean): void {
    this.checkLatestRelease = true;
    this.modalComponent.isVisible = false;

    if (!skipWarning) {
      return;
    }

    this.localStorageService.setBool(IGNORE_RELEASE_CHECK_WARNING, true);
  }

  public onPrereleaseToggle(): void {
    this.availableReleases$ = this.githubUpdateService.getReleases(this.showPrereleases);
  }

  public performAutoUpdate(): void {
    if (!this.selectedRelease) {
      this.toastrService.error('Please select a release to update to.');
      return;
    }

    this.autoUpdateInProgress = true;

    // Find the assets
    const firmwareAsset = this.selectedRelease.assets.find((asset: any) =>
      asset.name.includes('esp-miner') && asset.name.endsWith('.bin')
    );

    const wwwAsset = this.selectedRelease.assets.find((asset: any) =>
      asset.name === 'www.bin'
    );

    if (!firmwareAsset) {
      this.toastrService.error('Firmware file (esp-miner*.bin) not found for the selected release.');
      this.autoUpdateInProgress = false;
      return;
    }

    if (!wwwAsset) {
      this.toastrService.error('Website file (www.bin) not found for the selected release.');
      this.autoUpdateInProgress = false;
      return;
    }

    // Download firmware
    this.downloadFile(firmwareAsset.browser_download_url).subscribe({
      next: (firmwareBlob) => {
        const firmwareFile = new File([firmwareBlob], 'esp-miner.bin', { type: 'application/octet-stream' });

        // Update firmware
        this.performOTAUpdateInternal(firmwareFile).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.firmwareUpdateProgress = Math.round((event.loaded / (event.total as number)) * 100);
            } else if (event.type === HttpEventType.Response) {
              if (event.ok) {
                // Firmware updated, now download and update website
                this.downloadFile(wwwAsset.browser_download_url).subscribe({
                  next: (wwwBlob) => {
                    const wwwFile = new File([wwwBlob], 'www.bin', { type: 'application/octet-stream' });

                    // Update website
                    this.performWWWUpdateInternal(wwwFile).subscribe({
                      next: (wwwEvent) => {
                        if (wwwEvent.type === HttpEventType.UploadProgress) {
                          this.websiteUpdateProgress = Math.round((wwwEvent.loaded / (wwwEvent.total as number)) * 100);
                        } else if (wwwEvent.type === HttpEventType.Response) {
                          if (wwwEvent.ok) {
                            this.toastrService.success('Auto-update completed successfully! Device will restart.');
                            this.autoUpdateInProgress = false;
                          } else {
                            this.toastrService.error(wwwEvent.statusText);
                            this.autoUpdateInProgress = false;
                          }
                        } else if (wwwEvent instanceof HttpErrorResponse) {
                          const errorMessage = wwwEvent.error?.message || wwwEvent.message || 'Unknown error occurred';
                          this.toastrService.error('Website update failed: ' + errorMessage);
                          this.autoUpdateInProgress = false;
                        }
                      },
                      error: (err) => {
                        const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
                        this.toastrService.error('Website update failed: ' + errorMessage);
                        this.autoUpdateInProgress = false;
                      },
                      complete: () => {
                        this.websiteUpdateProgress = null;
                      }
                    });
                  },
                  error: (error) => {
                    this.toastrService.error('Failed to download website file: ' + error.message);
                    this.autoUpdateInProgress = false;
                  }
                });
              } else {
                this.toastrService.error(event.statusText);
                this.autoUpdateInProgress = false;
              }
            } else if (event instanceof HttpErrorResponse) {
              this.toastrService.error('Firmware update failed: ' + event.error);
              this.autoUpdateInProgress = false;
            }
          },
          error: (err) => {
            this.toastrService.error('Firmware update failed: ' + err.error);
            this.autoUpdateInProgress = false;
          },
          complete: () => {
            this.firmwareUpdateProgress = null;
          }
        });
      },
      error: (error) => {
        this.toastrService.error('Failed to download firmware file: ' + error.message);
        this.autoUpdateInProgress = false;
      }
    });
  }

  private downloadFile(url: string): Observable<Blob> {
    return this.httpClient.get(url, {
      responseType: 'blob'
    });
  }

  private performOTAUpdateInternal(file: File): Observable<any> {
    return this.systemService.performOTAUpdate(file)
      .pipe(this.loadingService.lockUIUntilComplete());
  }

  private performWWWUpdateInternal(file: File): Observable<any> {
    return this.systemService.performWWWOTAUpdate(file)
      .pipe(this.loadingService.lockUIUntilComplete());
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading';
@Component({ selector: 'app-spinner', standalone: true, imports: [CommonModule], templateUrl: './spinner.html', styleUrl: './spinner.css' })
export class SpinnerComponent { protected readonly loadingService = inject(LoadingService); }

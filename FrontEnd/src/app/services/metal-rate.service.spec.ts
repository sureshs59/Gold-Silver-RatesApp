import { TestBed } from '@angular/core/testing';

import { MetalRateService } from './metal-rate.service';

describe('MetalRateService', () => {
  let service: MetalRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetalRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

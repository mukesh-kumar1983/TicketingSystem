import { TestBed } from '@angular/core/testing';
import { ToastMessage, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose an empty initial toast collection', () => {
    let toasts: ToastMessage[] = [];

    service.toasts$.subscribe((value: ToastMessage[]) => {
      toasts = value;
    });

    expect(toasts).toEqual([]);
  });

  it('should show a success toast', () => {
    let toasts: ToastMessage[] = [];

    service.toasts$.subscribe((value: ToastMessage[]) => {
      toasts = value;
    });

    service.success('Operation completed successfully.');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operation completed successfully.');
  });

  it('should show an error toast', () => {
    let toasts: ToastMessage[] = [];

    service.toasts$.subscribe((value: ToastMessage[]) => {
      toasts = value;
    });

    service.error('Something went wrong.');

    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Something went wrong.');
  });

  it('should clear all toasts', () => {
    let toasts: ToastMessage[] = [];

    service.toasts$.subscribe((value: ToastMessage[]) => {
      toasts = value;
    });

    service.success('First message.');
    service.error('Second message.');

    expect(toasts.length).toBe(2);

    service.clear();

    expect(toasts).toEqual([]);
  });

  it('should support multiple toast messages', () => {
    let toasts: ToastMessage[] = [];

    service.toasts$.subscribe((value: ToastMessage[]) => {
      toasts = value;
    });

    service.success('First message.');
    service.error('Second message.');

    expect(toasts.length).toBe(2);
    expect(toasts[0].message).toBe('First message.');
    expect(toasts[1].message).toBe('Second message.');
  });
});

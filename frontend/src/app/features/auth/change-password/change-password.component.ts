import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  form: FormGroup;
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch }
    );
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.error.set(null);
    this.success.set(null);
    this.loading.set(true);

    const { currentPassword, newPassword } = this.form.value;
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.success.set('Password updated successfully.');
        this.loading.set(false);
        this.form.reset();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to change password. Please try again.');
        this.loading.set(false);
      },
    });
  }
}

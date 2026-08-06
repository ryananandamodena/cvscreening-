import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Supplier, Contract, ContractStatus, ContractPhase, Phase2ContractData, EvaluationCriteria, ScoringSystem } from './contract.service';

@Injectable({
  providedIn: 'root'
})
export class ContractValidationService {

  // Main contract validation
  validateContract(control: AbstractControl | Partial<Contract>): Observable<Partial<Contract>> {
    return new Observable<Partial<Contract>>(observer => {
      const errors = this.getContractErrors(control);
      
      if (errors.length > 0) {
        observer.error({ errors });
      } else {
        observer.next(control as Partial<Contract>);
        observer.complete();
      }
    });
  }

  getErrors(control: AbstractControl | Partial<Contract>): string[] {
    return this.getContractErrors(control);
  }

  private getContractErrors(control: AbstractControl | Partial<Contract>): string[] {
    const errors: string[] = [];

    if (typeof control === 'object' && !Array.isArray(control)) {
      const contract = control as Partial<Contract>;

      // Contract number validation
      if (!contract.contractNumber) {
        errors.push('Contract number is required');
      } else if (contract.contractNumber.length < 3) {
        errors.push('Contract number must be at least 3 characters');
      }

      // Title validation
      if (!contract.title) {
        errors.push('Title is required');
      } else if (contract.title.length > 200) {
        errors.push('Title must be less than 200 characters');
      }

      // Value validation
      if (contract.value === undefined || contract.value === null) {
        errors.push('Contract value is required');
      } else if (typeof contract.value !== 'number' || contract.value <= 0) {
        errors.push('Contract value must be a positive number');
      }

      // Currency validation
      if (!contract.currency) {
        errors.push('Currency is required');
      }

      // Status validation
      if (!contract.status) {
        errors.push('Status is required');
      }

      // Date validation
      if (!contract.startDate) {
        errors.push('Start date is required');
      } else if (contract.endDate && contract.endDate < contract.startDate) {
        errors.push('End date must be after start date');
      }

      // Supplier validation
      if (contract.supplier) {
        errors.push(...this.validateSupplier(contract.supplier));
      } else {
        errors.push('Supplier information is required');
      }

      // Phase 2 specific validation
      if (contract.phase === 'phase2' || contract.phase2Data) {
        errors.push(...this.validatePhase2Data(contract.phase2Data));
      }
    }

    return errors;
  }

  private validateSupplier(supplier: Supplier): string[] {
    const errors: string[] = [];

    if (!supplier.name) {
      errors.push('Supplier name is required');
    }

    if (!supplier.nip) {
      errors.push('NIP is required');
    } else if (!this.validateNIP(supplier.nip)) {
      errors.push('Invalid NIP format');
    }

    if (!supplier.address) {
      errors.push('Supplier address is required');
    }

    if (!supplier.bankAccount) {
      errors.push('Bank account is required');
    } else if (!this.validateBankAccount(supplier.bankAccount)) {
      errors.push('Invalid bank account format');
    }

    if (!supplier.contactPerson) {
      errors.push('Contact person is required');
    }

    if (!supplier.email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(supplier.email)) {
      errors.push('Invalid email format');
    }

    if (!supplier.phone) {
      errors.push('Phone number is required');
    }

    return errors;
  }

  private validatePhase2Data(data?: Phase2ContractData): string[] {
    const errors: string[] = [];
    if (!data) {
      errors.push('Phase 2 data is required for this contract type');
      return errors;
    }

    // Tender type validation
    if (!data.tenderType) {
      errors.push('Tender type is required');
    }

    // Evaluation criteria validation
    if (data.evaluationCriteria) {
      const { evaluationCriteria } = data;
      if (!evaluationCriteria.priceWeight || evaluationCriteria.priceWeight < 0 || evaluationCriteria.priceWeight > 100) {
        errors.push('Price weight must be between 0 and 100');
      }
      if (!evaluationCriteria.qualityWeight || evaluationCriteria.qualityWeight < 0 || evaluationCriteria.qualityWeight > 100) {
        errors.push('Quality weight must be between 0 and 100');
      }
      if (!evaluationCriteria.deliveryTimeWeight || evaluationCriteria.deliveryTimeWeight < 0 || evaluationCriteria.deliveryTimeWeight > 100) {
        errors.push('Delivery time weight must be between 0 and 100');
      }
    }

    // Scoring system validation
    if (data.scoringSystem) {
      const { scoringSystem } = data;
      if (scoringSystem.minScore >= scoringSystem.maxScore) {
        errors.push('Min score must be less than max score');
      }
      if (!scoringSystem.passingScore || scoringSystem.passingScore < scoringSystem.minScore || scoringSystem.passingScore > scoringSystem.maxScore) {
        errors.push('Passing score must be between min and max score');
      }
    }

    // Deadline validation
    if (!data.deadline) {
      errors.push('Deadline is required');
    } else if (data.deadline < new Date()) {
      errors.push('Deadline must be in the future');
    }

    // Regulatory compliance
    if (!data.regulatoryCompliance) {
      errors.push('Regulatory compliance must be confirmed');
    }

    return errors;
  }

  // Polish-specific validators
  validateNIP(nip: string): boolean {
    const nipPattern = /^\d{10}$/;
    if (!nipPattern.test(nip)) return false;
    
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(nip[i]) * weights[i];
    }
    
    const check = 11 - (sum % 11);
    if (check === 10 || check === 11) return parseInt(nip[9]) === 0;
    return parseInt(nip[9]) === check;
  }

  validateBankAccount(account: string): boolean {
    const accountPattern = /^\d{24,34}$/;
    return accountPattern.test(account);
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Phase 2 specific validators
  validateTenderDocuments(documents: TenderDocument[]): string[] {
    const errors: string[] = [];
    if (!documents || documents.length === 0) {
      errors.push('At least one tender document is required');
    }
    return errors;
  }

  validateEvaluationCriteria(criteria: EvaluationCriteria): string[] {
    const errors: string[] = [];
    const totalWeight = (criteria.priceWeight || 0) + (criteria.qualityWeight || 0) + (criteria.deliveryTimeWeight || 0);
    if (totalWeight !== 100) {
      errors.push('Evaluation criteria weights must sum to 100%');
    }
    return errors;
  }

  validateScoringSystem(system: ScoringSystem): string[] {
    const errors: string[] = [];
    if (system.minScore >= system.maxScore) {
      errors.push('Min score must be less than max score');
    }
    if (system.passingScore < system.minScore || system.passingScore > system.maxScore) {
      errors.push('Passing score must be within min-max range');
    }
    return errors;
  }

  // Form-level validators for Angular forms
  static getContractFormValidators() {
    return {
      contractNumber: [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      title: [Validators.required, Validators.maxLength(200)],
      value: [Validators.required, Validators.min(0.01)],
      currency: [Validators.required],
      status: [Validators.required],
      startDate: [Validators.required],
      supplier: [Validators.required]
    };
  }

  // Phase 2 form validators
  static getPhase2FormValidators() {
    return {
      tenderType: [Validators.required],
      deadline: [Validators.required, Validators.min(new Date().getTime())],
      regulatoryCompliance: [Validators.requiredTrue],
      evaluationCriteria: [Validators.required]
    };
  }
}

// Custom validator functions for Angular forms
export function validateNIP(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const nipPattern = /^\d{10}$/;
    return nipPattern.test(control.value) ? null : { invalidNIP: true };
  };
}

export function validateFutureDate(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value && control.value < new Date() ? { pastDate: true } : null;
  };
}

export function validateEndDateAfterStartDate(startDateControl: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const endDate = control.value;
    const startDate = startDateControl.value;
    return endDate && startDate && endDate < startDate ? { endBeforeStart: true } : null;
  };
}
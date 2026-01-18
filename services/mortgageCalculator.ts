import { LoanDetails, ExtraPayments, PaymentRow, ComparisonResult } from '../types';

export const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  if (annualRate === 0) return principal / (years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateSchedule = (
  details: LoanDetails,
  extras: ExtraPayments,
  accelerated: boolean
): PaymentRow[] => {
  const schedule: PaymentRow[] = [];
  let balance = details.loanAmount;
  const monthlyRate = details.interestRate / 100 / 12;
  const basePayment = calculateMonthlyPayment(details.loanAmount, details.interestRate, details.loanTermYears);
  
  let totalInterest = 0;
  let currentDate = new Date(details.startDate);
  // Ensure we don't loop infinitely if inputs are weird, cap at 100 years
  const maxMonths = 1200; 

  for (let month = 1; month <= maxMonths && balance > 0.01; month++) {
    const interestPayment = balance * monthlyRate;
    // Standard principal part of the base payment
    let standardPrincipal = basePayment - interestPayment;
    
    // Safety check for negative amortization
    if (standardPrincipal < 0) standardPrincipal = 0;

    let totalPrincipalPayment = standardPrincipal;
    let extraPaymentTotal = 0;
    let isExtraPayment = false;

    // Apply extras if accelerated
    if (accelerated) {
      // Monthly extra with annual increase logic
      if (extras.monthlyExtra > 0) {
        let currentMonthlyExtra = extras.monthlyExtra;
        
        if (extras.monthlyExtraIncreasePercentage && extras.monthlyExtraIncreasePercentage > 0) {
            // Calculate years passed (month starts at 1, so months 1-12 are year 0 for calculation purposes)
            const yearsPassed = Math.floor((month - 1) / 12);
            if (yearsPassed > 0) {
                currentMonthlyExtra = extras.monthlyExtra * Math.pow(1 + (extras.monthlyExtraIncreasePercentage / 100), yearsPassed);
            }
        }

        extraPaymentTotal += currentMonthlyExtra;
        isExtraPayment = true;
      }

      // Custom payments (One-time or Annual)
      if (extras.customPayments && extras.customPayments.length > 0) {
        extras.customPayments.forEach(payment => {
          const payDate = new Date(payment.date);
          let match = false;

          // Check for valid date
          if (!isNaN(payDate.getTime())) {
            if (payment.type === 'one-time') {
               // Match exact month and year
               match = currentDate.getFullYear() === payDate.getFullYear() &&
                       currentDate.getMonth() === payDate.getMonth();
            } else if (payment.type === 'annual') {
               // Match month, and year must be >= start year
               match = currentDate.getMonth() === payDate.getMonth() &&
                       currentDate.getFullYear() >= payDate.getFullYear();
            }
          }

          if (match && payment.amount > 0) {
            let amountToAdd = payment.amount;

            // Apply annual increase if applicable
            if (payment.type === 'annual' && payment.annualIncreasePercentage && payment.annualIncreasePercentage > 0) {
              const yearsPassed = currentDate.getFullYear() - payDate.getFullYear();
              if (yearsPassed > 0) {
                amountToAdd = payment.amount * Math.pow(1 + (payment.annualIncreasePercentage / 100), yearsPassed);
              }
            }

            extraPaymentTotal += amountToAdd;
            isExtraPayment = true;
          }
        });
      }
    }

    totalPrincipalPayment += extraPaymentTotal;
    
    let actualPayment = totalPrincipalPayment + interestPayment;

    // Handle final payment
    if (balance - totalPrincipalPayment < 0) {
      totalPrincipalPayment = balance;
      actualPayment = totalPrincipalPayment + interestPayment;
      // If final payment is less than base, extra is effectively 0 or negative relative to base, 
      // but strictly speaking, extra is whatever is above the required Interest + Scheduled Principal.
      // For simplicity in display, we just clamp extra.
      if (extraPaymentTotal > totalPrincipalPayment - standardPrincipal) {
          extraPaymentTotal = Math.max(0, totalPrincipalPayment - standardPrincipal);
      }
    }

    balance -= totalPrincipalPayment;
    totalInterest += interestPayment;

    schedule.push({
      month,
      date: formatDate(currentDate),
      payment: actualPayment,
      principal: totalPrincipalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, balance),
      totalInterestPaid: totalInterest,
      isExtraPayment,
      minPayment: basePayment,
      extraPayment: extraPaymentTotal
    });

    currentDate = addMonths(currentDate, 1);
  }

  return schedule;
};

export const calculateMortgage = (details: LoanDetails, extras: ExtraPayments): ComparisonResult => {
  const standardSchedule = generateSchedule(details, { monthlyExtra: 0, customPayments: [] }, false);
  const acceleratedSchedule = generateSchedule(details, extras, true);

  const standardTotalInterest = standardSchedule[standardSchedule.length - 1]?.totalInterestPaid || 0;
  const acceleratedTotalInterest = acceleratedSchedule[acceleratedSchedule.length - 1]?.totalInterestPaid || 0;

  return {
    standardSchedule,
    acceleratedSchedule,
    standardTotalInterest,
    acceleratedTotalInterest,
    standardPayoffDate: standardSchedule[standardSchedule.length - 1]?.date || details.startDate,
    acceleratedPayoffDate: acceleratedSchedule[acceleratedSchedule.length - 1]?.date || details.startDate,
    interestSaved: standardTotalInterest - acceleratedTotalInterest,
    timeSavedMonths: standardSchedule.length - acceleratedSchedule.length,
  };
};
import { GoogleGenAI, Type } from "@google/genai";
import { LoanDetails, AIScenario, ExtraPayments, ComparisonResult, AdvisorReportData, IncomeDetails } from "../types";
import { calculateMonthlyPayment } from "./mortgageCalculator";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractIncomeFromDocument = async (base64Data: string, mimeType: string): Promise<Partial<IncomeDetails>> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Analyze the provided document (image/PDF) which is likely a pay stub, tax return, bank statement, or employment verification.
    
    Extract the following financial details:
    - Annual Gross Income (Estimate if only monthly is available)
    - Monthly Net Income
    - Credit Score (if visible)
    - Employment Status (e.g., Employed, Self-Employed, Contractor)
    - Any other relevant financial context (bonuses, commissions, debts mentioned)
    
    Return a JSON object with keys: annualGrossIncome (number), monthlyNetIncome (number), creditScore (number), employmentStatus (string), additionalInfo (string).
    If a field is not found, leave it null or 0.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Lower budget for extraction task
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            annualGrossIncome: { type: Type.NUMBER },
            monthlyNetIncome: { type: Type.NUMBER },
            creditScore: { type: Type.NUMBER },
            employmentStatus: { type: Type.STRING },
            additionalInfo: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<IncomeDetails>;
    }
    return {};
  } catch (error) {
    console.error("Error extracting income data:", error);
    return {};
  }
};

export const generateScenarios = async (details: LoanDetails, incomeDetails?: IncomeDetails): Promise<AIScenario[]> => {
  // Upgraded to use Gemini 3 Pro with Thinking and Search
  const model = "gemini-3-pro-preview";
  
  // Calculate specific metrics for context
  const basePayment = calculateMonthlyPayment(details.loanAmount, details.interestRate, details.loanTermYears);
  const basePaymentFormatted = basePayment.toFixed(2);
  
  let incomeContext = "";
  if (incomeDetails) {
    incomeContext = `
    BORROWER FINANCIAL CONTEXT:
    - Annual Gross Income: $${incomeDetails.annualGrossIncome.toLocaleString()}
    - Monthly Net Income: $${incomeDetails.monthlyNetIncome.toLocaleString()}
    - Employment: ${incomeDetails.employmentStatus}
    - Additional Info: ${incomeDetails.additionalInfo}
    `;
  }

  const prompt = `
    First, perform a Google Search to identify current US mortgage interest rates (30-year fixed) and the general economic outlook regarding inflation and Federal Reserve rate decisions.

    Then, analyze the following mortgage scenario:
    - Loan Principal: $${details.loanAmount}
    - Annual Interest Rate: ${details.interestRate}%
    - Loan Term: ${details.loanTermYears} years
    - Base Monthly Payment (P&I): $${basePaymentFormatted}
    ${incomeContext}
    
    Act as a sophisticated financial advisor. Generate 3 distinct, creative, and realistic "what-if" payoff strategies.
    
    Consider the LIVE economic data you found. For example, if rates are high, emphasize guaranteed return on equity. If rates are dropping, mention refinancing possibilities in the reasoning (but still provide payoff strategies).

    Given the loan size and rate, focus on strategies that move the needle but are strictly feasible for the borrower if income data is provided.
    
    For each scenario, provide:
    - A catchy title.
    - A clear description.
    - The reasoning: Why this works mathematically, how it fits the CURRENT economic environment, and why it fits this user's profile.
    - A suggested additional monthly payment amount.
    - Optionally a suggested one-time lump sum.
    
    Provide the output in JSON format.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              suggestedExtraMonthly: { type: Type.NUMBER },
              suggestedOneTime: { type: Type.NUMBER }
            },
            required: ["id", "title", "description", "reasoning", "suggestedExtraMonthly"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as AIScenario[];
  } catch (error) {
    console.error("Error generating scenarios:", error);
    return [];
  }
};

export const generateAdvisorReport = async (
  details: LoanDetails, 
  extras: ExtraPayments, 
  comparison: ComparisonResult,
  incomeDetails?: IncomeDetails
): Promise<AdvisorReportData | null> => {
  const model = "gemini-3-pro-preview";
  
  const basePayment = calculateMonthlyPayment(details.loanAmount, details.interestRate, details.loanTermYears);
  
  let incomeContext = "Income details not provided.";
  if (incomeDetails && incomeDetails.annualGrossIncome > 0) {
    incomeContext = `
    BORROWER INCOME DATA:
    - Annual Gross: $${incomeDetails.annualGrossIncome.toLocaleString()}
    - Monthly Net: $${incomeDetails.monthlyNetIncome.toLocaleString()}
    - Employment: ${incomeDetails.employmentStatus}
    - Credit Score: ${incomeDetails.creditScore || 'N/A'}
    - Notes: ${incomeDetails.additionalInfo}
    `;
  }

  // Format data for the prompt
  const savings = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(comparison.interestSaved);
  const timeSavedYears = (comparison.timeSavedMonths / 12).toFixed(1);
  const payoffDate = new Date(comparison.acceleratedPayoffDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalInterest = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(comparison.acceleratedTotalInterest);

  const prompt = `
    You are a Senior Mortgage Financial Consultant preparing a formal strategy report for a client.
    
    Step 1: Perform a Google Search to get LIVE data on:
    - Current 30-year Fixed Mortgage Rates in the US.
    - Recent Federal Reserve interest rate decisions and future outlook.
    - Current CPI/Inflation trends.
    
    Step 2: Analyze the Client Profile using the live data context.
    
    CLIENT LOAN PROFILE:
    - Principal: $${details.loanAmount.toLocaleString()}
    - Rate: ${details.interestRate}%
    - Term: ${details.loanTermYears} years
    - Start Date: ${details.startDate}
    
    ${incomeContext}
    
    CURRENT ACCELERATION STRATEGY:
    - Base Required Payment: $${basePayment.toFixed(2)}
    - Regular Monthly Extra: $${extras.monthlyExtra} (increasing ${extras.monthlyExtraIncreasePercentage || 0}% annually)
    - Additional Lump Sums/Recurring: ${extras.customPayments.length} scheduled payments
    
    PROJECTED RESULTS:
    - Total Interest Saved: ${savings}
    - Time Saved: ${timeSavedYears} years
    - New Payoff Date: ${payoffDate}
    - Total Interest Cost: ${totalInterest}

    TASK:
    Write a comprehensive, professional financial report analyzing this specific strategy. 
    
    CRITICAL: 
    - Contextualize the advice based on the Income Data if available.
    - Integrate the LIVE economic data. Compare the user's rate (${details.interestRate}%) to current market rates. 
    
    The report must be structured into JSON with the following sections:
    1. Executive Summary
    2. Market Context & Economic Environment (Detailed analysis of current rates, inflation, and how the user's loan compares).
    3. Income & Affordability Analysis (Specific check against their provided income).
    4. Strategy Analysis.
    5. Financial Impact.
    6. Risk Assessment & Opportunity Cost (Consider high-yield savings rates found in your search vs paying down debt).
    7. Final Recommendation.
    8. Disclaimer.

    Use the thinking process to evaluate affordability and mathematical impact deeply.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            generatedDate: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["heading", "content"]
              }
            }
          },
          required: ["title", "sections"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text) as AdvisorReportData;
    if (!data.generatedDate) data.generatedDate = new Date().toLocaleDateString();

    // Extract sources from grounding metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((s): s is { title: string; uri: string } => s !== null && !!s.uri);
    
    if (sources && sources.length > 0) {
      data.sources = sources;
    }
    
    return data;
  } catch (error) {
    console.error("Error generating advisor report:", error);
    return null;
  }
};
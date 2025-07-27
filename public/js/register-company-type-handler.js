/*
Register Company Type Handler - Simplified
Handles only company type selection (manufacturer/distributor)
Senior Software Engineer Clean Code Implementation
*/

(function() {
    'use strict';

    class RegisterCompanyTypeHandler {
        constructor() {
            this.init();
        }

        init() {
            this.updateSummaryHandlers();
        }

        updateSummaryHandlers() {
            // Update summary when any field changes
            const fieldsToWatch = [
                'companyName', 'email', 'phone', 'taxNumber', 
                'activityType', 'companyType', 'country', 'city'
            ];

            fieldsToWatch.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('change', () => this.updateSummary());
                    field.addEventListener('input', () => this.updateSummary());
                }
            });
        }

        updateSummary() {
            // Basic fields
            this.updateSummaryField('companyName', 'summaryCompanyName');
            this.updateSummaryField('email', 'summaryEmail');
            this.updateSummaryField('phone', 'summaryPhone');
            this.updateSummaryField('taxNumber', 'summaryTaxNumber');
            this.updateSummaryField('country', 'summaryCountry');
            this.updateSummaryField('city', 'summaryCity');

            // Activity Type (with translation)
            this.updateActivityTypeSummary();
            
            // Company Type (with translation)
            this.updateCompanyTypeSummary();
        }

        updateSummaryField(sourceId, targetId) {
            const sourceElement = document.getElementById(sourceId);
            const targetElement = document.getElementById(targetId);
            
            if (sourceElement && targetElement) {
                const value = sourceElement.value || '-';
                targetElement.textContent = value;
            }
        }

        updateActivityTypeSummary() {
            const activityTypeSelect = document.getElementById('activityType');
            const summaryElement = document.getElementById('summaryActivityType');
            
            if (activityTypeSelect && summaryElement) {
                const selectedOption = activityTypeSelect.options[activityTypeSelect.selectedIndex];
                const displayText = selectedOption && selectedOption.value ? selectedOption.text : '-';
                summaryElement.textContent = displayText;
            }
        }

        updateCompanyTypeSummary() {
            const companyTypeSelect = document.getElementById('companyType');
            const summaryElement = document.getElementById('summaryCompanyType');
            
            if (companyTypeSelect && summaryElement) {
                const selectedOption = companyTypeSelect.options[companyTypeSelect.selectedIndex];
                const displayText = selectedOption && selectedOption.value ? selectedOption.text : '-';
                summaryElement.textContent = displayText;
            }
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new RegisterCompanyTypeHandler();
    });

    // Export for use in other scripts
    window.RegisterCompanyTypeHandler = RegisterCompanyTypeHandler;

})(); 
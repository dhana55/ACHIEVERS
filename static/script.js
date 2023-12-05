document.addEventListener('DOMContentLoaded', function() {
    loadPayments();
    populateDueDates();
    document.getElementById('payment-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('tax-rate').addEventListener('blur', calculateAndDisplayTax);
    document.getElementById('due_date').addEventListener('change', calculateAndDisplayTax);
    document.getElementById('due_date').addEventListener('change', handleDueDateChange);
});
function handleDueDateChange() {
    const dueDate = document.getElementById('due_date').value;
    if (dueDate) {
        fetch(`/payments/due_date/${dueDate}`)
            .then(response => response.json())
            .then(data => {
                if(data.error) {
                    alert(data.error);
                    return;
                }
                displayPayments(data.payments);
                displayTaxDetails(data.total_amount, data.tax_rate, data.tax_due);
            });
    }
}
function populateDueDates() {
    const dueDateSelect = document.getElementById('due_date');
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Clear existing options
    dueDateSelect.innerHTML = '';

    // Due dates for the current year
    const dueDates = [
        `April 15, ${currentYear}`,
        `June 15, ${currentYear}`,
        `September 15, ${currentYear}`,
        `January 15, ${nextYear}`
    ];

    // Generate due date options
    dueDates.forEach(date => {
        const [monthDay, year] = date.split(', ');
        const optionValue = new Date(`${monthDay}, ${year}`).toISOString().split('T')[0];
        const option = new Option(date, optionValue);
        dueDateSelect.add(option);
    });
}

function loadPayments() {
    fetch('/payments')
        .then(response => response.json())
        .then(data => {
            displayPayments(data);
            calculateAndDisplayTax(); 
            displaySummary();
        });
}

function displayPayments(payments) {
    const paymentsTable = document.getElementById('payments-table-body');
    paymentsTable.innerHTML = '';
    payments.forEach(payment => {
        const row = paymentsTable.insertRow();
        row.innerHTML = `<td>${payment.id}</td>
                         <td>${payment.company}</td>
                         <td>${payment.amount}</td>
                         <td>${payment.payment_date ? payment.payment_date : 'N/A'}</td>
                         <td>${payment.status}</td>
                         <td>${payment.due_date}</td>
                         <td>
                            <button onclick="editPayment(${payment.id})">Edit</button>
                            <button onclick="deletePayment(${payment.id})">Delete</button>
                         </td>`;
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const paymentData = Object.fromEntries(formData.entries());

    // Determine if we're adding a new payment or updating an existing one
    const isUpdating = paymentData.payment_id !== "";
    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating ? `/payments/${paymentData.payment_id}` : '/payments';

    if (isUpdating) {
        delete paymentData.payment_id;
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    })
    .then(response => response.json())
    .then(() => {
        loadPayments(); // Reload the list of payments
        event.target.reset(); // Reset the form
        // If updating, clear the hidden payment_id field for future submissions
        if (isUpdating) {
            document.getElementById('payment_id').value = "";
        }
    });
}


function editPayment(id) {
    // Fetch the details of the payment to be edited
    fetch(`/payments/${id}`) 
    .then(response => {
        if (!response.ok) {
            throw new Error('Payment not found');
        }
        return response.json();
    })
    .then(payment => {
        // Populate the form fields with the payment data for editing
        document.getElementById('company').value = payment.company;
        document.getElementById('amount').value = payment.amount;
        document.getElementById('payment_date').value = payment.payment_date;
        document.getElementById('status').value = payment.status;
        document.getElementById('due_date').value = payment.due_date;
        document.getElementById('tax-rate').value = payment.tax_rate;

        // Assuming you have a hidden field to store the ID of the payment being edited
        document.getElementById('payment_id').value = payment.id;
    })
    .catch(error => {
        console.error('Error fetching payment details:', error);
        alert('An error occurred while trying to fetch payment details.');
    });
}


document.getElementById('edit-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const paymentId = formData.get('payment_id'); 
    const updatedPaymentData = Object.fromEntries(formData.entries());

    // Remove the id from the data to be sent
    delete updatedPaymentData.payment_id;

    fetch(`/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPaymentData),
    })
    .then(response => response.json())
    .then(() => {
        loadPayments();
        document.getElementById('edit-form').style.display = 'none';
    })
    .catch(error => {
        console.error('Error updating payment:', error);
        alert('An error occurred while trying to update the payment.');
    });
});


function deletePayment(id) {
    if(confirm('Are you sure you want to delete this payment?')) {
        fetch(`/payments/${id}`, { method: 'DELETE' })
        .then(() => loadPayments());
    }
}

// Make sure calculateAndDisplayTax function is defined before it's referenced in your event listeners
function calculateAndDisplayTax() {
    const dueDate = document.getElementById('due_date').value;
    const taxRateElement = document.getElementById('tax-rate');
    const taxRate = parseFloat(taxRateElement.value) || 0;

    if (!dueDate) {
        return; // Do not proceed if due date is not set
    }
    console.log('Tax Rate sent:', taxRate);

    fetch('/payments/calculate_tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date: dueDate, tax_rate: taxRate }), // Send tax rate as entered
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('total-amount').textContent = `$${data.total_amount.toFixed(2)}`;
        document.getElementById('tax-due').textContent = `$${data.tax_due.toFixed(2)}`;
        document.getElementById('display-tax-rate').textContent = `${data.tax_rate.toFixed(2)}%`;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayTaxDetails(totalAmount, taxRate, taxDue) {
    // Update the UI elements with these values
    document.getElementById('total-amount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('display-tax-rate').textContent = `${(taxRate * 100).toFixed(2)}%`;
    document.getElementById('tax-due').textContent = `$${taxDue.toFixed(2)}`;
}



// Add event listener for tax-rate blur event
document.getElementById('tax-rate').addEventListener('blur', calculateAndDisplayTax);

function displaySummary() {
    const paymentsTable = document.getElementById('payments-table-body');
    const taxRateElement = document.getElementById('tax-rate');
    const taxRate = taxRateElement.value ? parseFloat(taxRateElement.value) / 100 : 0;
    let totalAmount = 0;

    for (let row of paymentsTable.rows) {
        totalAmount += parseFloat(row.cells[2].textContent);
    }
    
    const taxDue = totalAmount * taxRate;
    
    document.getElementById('total-amount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('tax-due').textContent = `$${taxDue.toFixed(2)}`;
}

//document.getElementById('tax-rate').addEventListener('blur', calculateAndDisplayTax);
// Add the event listener for the due_date select element
document.getElementById('due_date').addEventListener('change', function() {
    // Call calculateAndDisplayTax when the due_date changes
    calculateAndDisplayTax();
});
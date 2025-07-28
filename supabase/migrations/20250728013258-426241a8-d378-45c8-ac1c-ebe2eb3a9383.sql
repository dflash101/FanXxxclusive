-- Clean up duplicate crypto payment methods
DELETE FROM payment_methods WHERE id = '519fa8b0-385a-4e60-9cc6-f4fbee2715d9';

-- Update the remaining crypto payment method to be enabled
UPDATE payment_methods 
SET enabled = true, name = 'Crypto Pay'
WHERE type = 'crypto' AND id = '6dc11d61-cfe2-4f0b-9fb1-c522c0c5530b';
-- Migration to add 'to_account_id' for Self Transfers
ALTER TABLE transactions 
ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

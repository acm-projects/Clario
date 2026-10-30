# The Wrong Revenue Report

Finance sees cent-level discrepancies and orders booked to the wrong day around month-end and DST.

## Contract
daily_revenue groups aware timestamps by the requested IANA timezone (default America/Los_Angeles). Convert money using Decimal(str(value)). Round each order's discounted gross half-up to cents before aggregation. paid contributes gross; refunded contributes negative gross; cancelled contributes zero; partially_refunded contributes gross minus refund_amount (already a dollar amount). Return a mapping from date to numeric dollars, including zero-total days encountered in input.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.

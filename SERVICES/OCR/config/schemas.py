"""JSON schemas and helpers for extracted lease fields (Page 1 and Page 11)."""

# Page 1 - Lease header and terms
PAGE1_SCHEMA = {
    "landlord_contact_phone": str,
    "landlord_contact_email": str,
    "agreement_date": str,
    "landlord_agent_name": str,
    "tenant_name": str,
    "property_address": str,
    "lease_term_months": str,
    "lease_start_date": str,
    "lease_end_date": str,
    "monthly_rent_amount": str,
    "late_fee_percentage": str,
    "returned_check_fee": str,
    "form_id": str,
    "page_number": str,
}

# Page 11 - Signatures, financials, guarantors
PAGE11_SCHEMA = {
    "addendum_attached": str,  # "Yes" or "No"
    "tenant_signature_name": str,
    "tenant_signature_date": str,
    "landlord_signature_name": str,
    "landlord_signature_date": str,
    "security_deposit_amount": str,
    "security_deposit_from": str,
    "security_deposit_date": str,
    "first_month_rent_amount": str,
    "first_month_rent_from": str,
    "first_month_rent_date": str,
    "prorata_rent_amount": str,
    "prorata_rent_from": str,
    "prorata_rent_date": str,
    "guarantors_used": str,  # "Yes" or "No"
    "guarantor_1_name": str,
    "guarantor_1_address": str,
    "guarantor_1_date": str,
    "guarantor_2_name": str,
    "guarantor_2_address": str,
    "guarantor_2_date": str,
    "guarantor_3_name": str,
    "guarantor_3_address": str,
    "guarantor_3_date": str,
}

# Lists of target field names used throughout the project
TARGET_FIELDS_P1 = list(PAGE1_SCHEMA.keys())
TARGET_FIELDS_P11 = list(PAGE11_SCHEMA.keys())


# Empty templates for initialization
def empty_page1():
    return {k: "" for k in PAGE1_SCHEMA}


def empty_page11():
    return {k: "" for k in PAGE11_SCHEMA}


def target_extraction_p1():
    """Return an empty extraction result dict for Page 1."""
    return empty_page1()


def target_extraction_p11():
    """Return an empty extraction result dict for Page 11."""
    return empty_page11()

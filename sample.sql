select
  *
from
  (
    select
      (
        Select
          province_name
        from
          custom.province
        where
          g.sol_id = sol_id
      ) province_name,
      sol_id,(
        select
          sol_desc
        from
          tbaadm.sol
        where
          g.sol_id = sol_id
      ) sol_desc,
      acct_name,
      foracid,
      acct_opn_Date,
      cif_id,CASE
        WHEN ac.CONSTITUTION_CODE IN ('INDIV', 'INDIJ') THEN (
          SELECT
            cust_type
          from
            crmuser.accounts at
          where
            at.orgkey = ac.orgkey
        )
        WHEN aC.CONSTITUTION_CODE not IN ('INDIV', 'INDIJ') THEN (
          SELECT
            LEGALENTITY_TYPE
          from
            crmuser.corporate c
          where
            c.corp_key = ac.orgkey
        )
      end cust_type_code
    from
      tbaadm.gam g
      join crmuser.accounts ac on g.cif_id = ac.orgkey
    where
      acct_ownership = 'C'
      AND ACCT_CLS_FLG = 'N'
  )
where
  cust_type_code in ('3.4.2', '3.4.6')
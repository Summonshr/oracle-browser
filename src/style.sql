select
  *
from
  (
    SELECT
      CIF_ID,
      CUST_ID,(
        SELECT
          PROVINCE_NAME
        FROM
          CUSTOM.PROVINCE
        WHERE
          G.SOL_ID = SOL_ID
      ) AS PROVINCE_NAME,
      (
        SELECT
          SUB_PROVINCIAL
        FROM
          CUSTOM.PROVINCE
        WHERE
          G.SOL_ID = SOL_ID
      ) SUB_PROVINCIAL,
      (
        SELECT
          SOL_DESC
        FROM
          TBAADM.SOL
        WHERE
          SOL_ID = G.SOL_ID
      ) aS BRANCH_NAME,
      (
        select
          ADDRESS_LINE1
        from
          CRMUSER.ADDRESS
        where
          addresscategory = 'Registered'
          and g.cif_id = orgkey(+)
          and rownum = 1
      ) as address_register,
      (
        select
          ADDRESS_LINE1
        from
          CRMUSER.ADDRESS
        where
          addresscategory = 'Mailing'
          and g.cif_id = orgkey(+)
          and rownum = 1
      ) as address_Mailing,
      AC.OCCUPATION,
      CASE
        WHEN ac.CONSTITUTION_CODE IN ('INDIV', 'INDIJ') THEN (
          SELECT
            riskrating
          from
            crmuser.accounts at
          where
            at.orgkey = ac.orgkey
        )
        WHEN aC.CONSTITUTION_CODE not IN ('INDIV', 'INDIJ') THEN (
          SELECT
            riskrating
          from
            crmuser.corporate c
          where
            c.corp_key = ac.orgkey
        )
      end riskrating,
      AC.CONSTITUTION_CODE,
      AC.MANAGEROPINION,
      foracid,
      acct_name,
      acct_Cls_flg,
      CASE
        WHEN ac.CONSTITUTION_CODE IN ('INDIV', 'INDIJ') THEN (
          SELECT
            AT.PHYSICAL_STATE
          from
            crmuser.accounts at
          where
            at.orgkey = ac.orgkey
        )
        WHEN aC.CONSTITUTION_CODE not IN ('INDIV', 'INDIJ') THEN (
          SELECT
            entityclass
          from
            crmuser.corporate c
          where
            c.corp_key = ac.orgkey
        )
      end kyc_rating,
      g.frez_code,
      (
        Select
          freeze_rmks
        from
          tbaadm.gac
        where
          gac.acid = g.acid
      ) as freeze_rmks,
      acct_opn_date,
      schm_code,
      schm_type,
      (
        select
          schm_desc
        from
          tbaadm.gsp
        where
          gsp.schm_code = G.schm_code
      ) schm_desc,
      clr_bal_amt as current_bal,
      TBAADM.COMMONPACKAGE.eabbal(g.acid, '13-apr-2019') apr_13_bal,
      TBAADM.COMMONPACKAGE.eabbal(g.acid, '15-JUL-2018') AC_15_JUL_2018_bal,
      TBAADM.COMMONPACKAGE.eabbal(g.acid, '15-JUL-2017') AC_15_JUL_2017_bal,
      TBAADM.COMMONPACKAGE.eabbal(g.acid, '15-JUL-2016') AC_15_JUL_2016_bal,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2014'
          AND '15-JUL-2015'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_14_15_CREDIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2014'
          AND '15-JUL-2015'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_14_15_CREDIT_SUM_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2014'
          AND '15-JUL-2015'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_14_15_DEBIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2014'
          AND '15-JUL-2015'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_14_15_DEBIT_SUM_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2015'
          AND '15-JUL-2016'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_15_16_CREDIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2015'
          AND '15-JUL-2016'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_15_16_CREDIT_SUM_TRAN,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2015'
          AND '15-JUL-2016'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_15_16_DEBIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2015'
          AND '15-JUL-2016'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_15_16_DEBIT_SUM_TRAN,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2016'
          AND '15-JUL-2017'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_16_17_CREDIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2016'
          AND '15-JUL-2017'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_16_17_CREDIT_TRAN_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2016'
          AND '15-JUL-2017'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_16_17_DEBIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2016'
          AND '15-JUL-2017'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_16_17_DEBIT_TRAN_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2017'
          AND '15-JUL-2018'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_17_18_CREDIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2017'
          AND '15-JUL-2018'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_17_18_CREDIT_SUM_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2017'
          AND '15-JUL-2018'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_17_18_DEBIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2017'
          AND '15-JUL-2018'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_17_18_DEBIT_SUM_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2018'
          AND '15-JUL-2019'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_18_19_CREDIT,
      (
        SELECT
          SUM(TRAN_AMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2018'
          AND '15-JUL-2019'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'C'
      ) JUL_18_19_CREDIT_TRAN_AMT,
      (
        SELECT
          COUNT(*)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2018'
          AND '15-JUL-2019'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_18_19_DEBIT,
      (
        SELECT
          SUM(TRAN_aMT)
        FROM
          TBAADM.HTD H
        WHERE
          G.ACID = H.ACID
          AND TRAN_DATE BETWEEN '16-JUL-2018'
          AND '15-JUL-2019'
          AND DEL_FLG = 'N'
          AND PART_TRAN_TYPE = 'D'
      ) JUL_18_19_DEBIT_SUM_TRAN,
      (
        case
          when schm_type in ('SBA', 'CAA') THEN (
            SELECT
              ACCT_STATUS
            FROM
              TBAADM.SMT
            WHERE
              G.ACID = SMT.ACID
          )
          when schm_type in ('ODA', 'CAA') THEN (
            SELECT
              ACCT_STATUS
            FROM
              TBAADM.CAM
            WHERE
              G.ACID = CAM.ACID
          )
        END
      ) ACCT_STATUS,
      acct_cls_date
    from
      TBAADM.GAM g
      join crmuser.accounts ac on g.cif_id = ac.orgkey
    where
      acct_ownership <> 'O'
  )
where
  riskrating in ('H2')
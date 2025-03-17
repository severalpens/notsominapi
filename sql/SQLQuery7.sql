select * from Book1
where Result_Quality_Subcategory = 'preferred answer not found'
and Search_id not in (select Search_ID from tst.SearchQueryTestSet where expected_result_exists = '1' and result_quality = '0');

select * from tst.SearchQueryTestSet;
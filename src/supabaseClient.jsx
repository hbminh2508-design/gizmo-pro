import { createClient } from '@supabase/supabase-js';

// URL gốc của dự án (đã bỏ /rest/v1/)
const supabaseUrl = 'https://eshoxnzsaeicygnjcreg.supabase.co';

// Điền lại toàn bộ đoạn mã Publishable key của bạn vào đây
const supabaseKey = 'sb_publishable_jenWtEio6E1a9z8s37ZMJA_3ZscaioB'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
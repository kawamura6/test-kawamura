import { serve } from "https://deno.land/std@0.151.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.34.0';

let url = 'https://ekzwclcfheomwmnteywk.supabase.co';
let anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrendjbGNmaGVvbXdtbnRleXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njc1NzE2NjQsImV4cCI6MTk4MzE0NzY2NH0.5ZeHJT23ZrIzOWJQtP4AncFpqCMp-lB2xbxXF592zpg';
const supabase = createClient(url, anon_key);
let obj;
let main_obj;

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  if (req.method === "POST" && pathname === "/register") {
    const requestJson = await req.json();
    let sp = await supabase // userテーブルへ問い合わせ
      .from('user')
      .select()
      .eq( 'username', requestJson.username );

    if (sp.data.length == 0){
      let sp1 = await supabase // userテーブルへ問い合わせ
        .from('user')
        .insert({ username: `${requestJson.username}`, password: `${requestJson.password}` });
      
      if (sp1.error == null) {
        return new Response('register successfully'); // 新規登録成功と返す
      }else{
        return new Response('internal error'); // 内部エラーと返す
      }
      
    }else{
      return new Response('same username already registered'); // ユーザー名被りエラーと返す
    }
  }

  if (req.method === "POST" && pathname === "/login") {
    const requestJson = await req.json();
    let sp = await supabase // userテーブルへ問い合わせ
      .from('user')
      .select()
      .eq( 'username', requestJson.username )
      .eq( 'password', requestJson.password );
    
    if (sp.error == null) { // エラーがないとき
      if (sp.data.length == 1){ // データベースに、対応するアカウントが１つある場合
        return new Response(sp.data[0].group); // groupカラムと、ログイン成功を返す

      }else if (sp.data.length < 1){ // データベースに、対応するアカウントがない場合
        return new Response('-1'); // ログイン失敗（エラー）と返す

      }else{ // データベースに、対応するアカウントが２つ以上ある場合（そんなことは通常ありえない）
        return new Response('-2'); // エラーと返す
      }

    }else{
      return new Response('-3'); // エラーと返す
    }
  }








  //　コーディネート初期化
  if (req.method === "GET" && pathname === "/reset_obj") {
    main_obj = await supabase.from('calendar').select().rangeGt('sche_start', '[2022-11-01 00:00, 2022-11-01 00:00)');
  }

  // コーディネートの投稿
  if (req.method === "POST" && pathname === "/code_info") {
    const requestJson = await req.json();
    let sp = await supabase
      .from('calendar')
      .insert({ group: `${requestJson.group}`, sche_start: `${requestJson.sche_start}`, sche_end: `${requestJson.sche_end}`, comment: `${requestJson.comment}` }); // calendarへデータ挿入
    if (sp.error == null) {
      return new Response("finished");
    } else {
      return new Response(sp.error.message);
    }
  }

  // データベース更新確認
  async function base_select() {
    main_obj = await supabase.from('calendar').select().rangeGt('sche_start', '[2022-11-01 00:00, 2022-11-01 00:00)');
    return main_obj;
  };

  if (req.method === "POST" && pathname === "/code_info2") {
    const requestJson = await req.json();
    let group = requestJson.group;
    let time = requestJson.time;
    let sp = await supabase // calendarテーブルへ問い合わせ
      .from('calendar')
      .select()
      .eq('group', group);
    
    let data = '';
    if (sp.error == null) {
      for (let i = 0; i < sp.data.length; i++) {
        if (sp.data[i].sche_start.includes(`${time}`)){
          data += sp.data[i].created_at + '||';
          data += sp.data[i].sche_start + '||';
          data += sp.data[i].sche_end + '||';
          data += sp.data[i].comment + '@@';
        }
      }
      return new Response(data);
    } else {
      return new Response('Database Error');
    }
  }

  // 現在の投稿数を確認
  if (req.method === "GET" && pathname === "/code_info") {
    obj = await base_select();
    if (obj.error == null) {
      let max_id = obj.data.length-1;
      return new Response(max_id);
    }
  };

  // 投稿を削除
  if (req.method === "POST" && pathname === "/code_info_del") {
    const requestJson = await req.json();
    let id_del = Number(requestJson.id);
    obj = await supabase.from('calendar').select();
    if (obj.error == null) {
      let id = obj.data[id_del].id;
      obj = await supabase.from('calendar').delete().match({ id });
      return new Response(id_del-1);
    }
  };








  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
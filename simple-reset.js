// Simple script to reset Firebase database using Firestore REST API
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase 데이터베이스 초기화 도구');
console.log('=====================================');
console.log('');
console.log('⚠️  경고: 이 작업은 프로덕션 데이터베이스의 모든 데이터를 영구적으로 삭제합니다.');
console.log('');

rl.question('정말 모든 데이터를 삭제하시겠습니까? "DELETE ALL DATA" 라고 입력하여 확인하세요: ', (answer) => {
  if (answer === 'DELETE ALL DATA') {
    console.log('');
    console.log('📝 Firebase Console에서 데이터를 수동으로 삭제하세요:');
    console.log('1. https://console.firebase.google.com/project/lokey-service/firestore 로 이동');
    console.log('2. 각 컬렉션(partners, deals, coupons, users 등)을 선택');
    console.log('3. 컬렉션 탭에서 "컬렉션 삭제" 클릭');
    console.log('4. 확인 메시지에서 다시 삭제 확인');
    console.log('');
    console.log('🔄 또는 Firebase CLI를 사용:');
    console.log('firebase firestore:delete --all-collections --project lokey-service');
    console.log('');
    console.log('✅ 안전한 데이터 삭제를 위해 위 방법 중 하나를 사용하세요.');
  } else {
    console.log('❌ 데이터 삭제가 취소되었습니다. 올바르게 입력해주세요.');
  }
  rl.close();
});
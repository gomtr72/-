document.addEventListener('DOMContentLoaded', () => {
    // 요소 참조
    const dateInput = document.getElementById('meal-date');
    const searchBtn = document.getElementById('search-btn');
    const dateDisplay = document.querySelector('.meal-date-display');
    const mealMenu = document.querySelector('.meal-menu');
    const mealNutrition = document.querySelector('.meal-nutrition');
    const loadingElem = document.querySelector('.loading');
    const errorElem = document.querySelector('.error-message');
    const mealDetails = document.querySelector('.meal-details');
    
    // 오늘 날짜를 기본값으로 설정
    const today = new Date();
    const formattedToday = formatDate(today);
    dateInput.value = formattedToday;
    
    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', fetchMealInfo);
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchMealInfo();
        }
    });
    
    // 페이지 로드 시 false 텍스트 제거
    removeFalseText();
    
    // 페이지 로드 시 오늘 날짜의 급식 정보 가져오기
    fetchMealInfo();
    
    // 급식 정보를 가져오는 함수
    function fetchMealInfo() {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            showError('날짜를 선택해주세요.');
            return;
        }
        
        // YYYYMMDD 형식으로 변환
        const formattedDate = selectedDate.replace(/-/g, '');
        
        // 로딩 상태 표시
        showLoading(true);
        showError(false);
        
        // API URL 구성
        const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7541012&MLSV_YMD=${formattedDate}&Type=json`;
        
        // API 호출
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('네트워크 응답이 올바르지 않습니다.');
                }
                return response.json();
            })
            .then(data => {
                showLoading(false);
                
                try {
                    // API 응답 처리
                    // 급식 정보가 없는 경우 (INFO-200 코드)
                    if (data.RESULT && data.RESULT.CODE === 'INFO-200') {
                        showNoMealInfo(selectedDate);
                        return;
                    }
                    
                    // mealServiceDietInfo가 없는 경우
                    if (!data.mealServiceDietInfo) {
                        showNoMealInfo(selectedDate);
                        return;
                    }
                    
                    // 급식 정보 표시
                    displayMealInfo(data.mealServiceDietInfo, selectedDate);
                } catch (error) {
                    console.error('API 응답 처리 오류:', error);
                    showNoMealInfo(selectedDate);
                }
                
                // false 텍스트 제거
                removeFalseText();
            })
            .catch(error => {
                showLoading(false);
                showError(`급식 정보를 가져오는 중 오류가 발생했습니다: ${error.message}`);
            });
    }
    
    // 급식 정보를 화면에 표시하는 함수
    function displayMealInfo(mealData, selectedDate) {
        try {
            // 날짜 표시
            const displayDate = formatDisplayDate(selectedDate);
            dateDisplay.textContent = `${displayDate} 급식 정보`;
            
            // 급식 정보 추출 - 데이터 구조 검증
            if (!mealData[1] || !mealData[1].row || !mealData[1].row[0]) {
                showNoMealInfo(selectedDate);
                return;
            }
            
            const mealInfo = mealData[1].row[0];
            
            // 메뉴 정보 추출 및 표시
            if (!mealInfo.DDISH_NM) {
                showNoMealInfo(selectedDate);
                return;
            }
            
            // 메뉴 표시
            let menuHtml = '<h3>급식 메뉴</h3><ul>';
            
            // <br/> 또는 <br> 태그로 분리된 메뉴 항목 처리
            const menuItems = mealInfo.DDISH_NM.replace(/<br>/gi, '<br/>').split('<br/>');
            
            menuItems.forEach(item => {
                // 알레르기 정보 처리 (숫자 제거)
                const cleanItem = item.replace(/\(\d+\.\d+\)|\(\d+\)/g, '').trim();
                if (cleanItem) {
                    menuHtml += `<li>${cleanItem}</li>`;
                }
            });
            menuHtml += '</ul>';
            mealMenu.innerHTML = menuHtml;
            
            // 영양 정보 표시
            let nutritionHtml = '<h3>영양 정보</h3>';
            
            // 열량 정보 표시
            if (mealInfo.CAL_INFO) {
                nutritionHtml += `<p>열량: ${mealInfo.CAL_INFO}</p>`;
            }
            
            // 영양소 정보가 있는 경우 추가
            if (mealInfo.NTR_INFO) {
                const nutritionItems = mealInfo.NTR_INFO.replace(/<br>/gi, '<br/>').split('<br/>');
                nutritionItems.forEach(item => {
                    if (item.trim()) {
                        nutritionHtml += `<p>${item.trim()}</p>`;
                    }
                });
            }
            
            mealNutrition.innerHTML = nutritionHtml;
            
            // 급식 정보 섹션 표시
            mealDetails.querySelector('h2').style.display = 'none';
            mealDetails.style.display = 'block';
            
            // false 텍스트가 표시되는 문제 해결을 위해 부모 요소 확인
            removeFalseText();
            
        } catch (error) {
            console.error('급식 정보 표시 오류:', error);
            showNoMealInfo(selectedDate);
        }
    }
    
    // 급식 정보가 없는 경우 표시하는 함수
    function showNoMealInfo(selectedDate) {
        const displayDate = formatDisplayDate(selectedDate);
        dateDisplay.textContent = `${displayDate}`;
        
        mealDetails.querySelector('h2').textContent = '해당 날짜의 급식 정보가 없습니다.';
        mealDetails.querySelector('h2').style.display = 'block';
        mealMenu.innerHTML = '';
        mealNutrition.innerHTML = '';
        mealDetails.style.display = 'block';
        
        // false 텍스트 제거
        removeFalseText();
    }
    
    // 로딩 상태를 표시하는 함수
    function showLoading(isLoading) {
        if (isLoading) {
            loadingElem.style.display = 'block';
            mealDetails.style.display = 'none';
        } else {
            loadingElem.style.display = 'none';
        }
    }
    
    // 에러 메시지를 표시하는 함수
    function showError(message, show = true) {
        if (show) {
            errorElem.textContent = message;
            errorElem.style.display = 'block';
            mealDetails.style.display = 'none';
        } else {
            errorElem.style.display = 'none';
        }
    }
    
    // 페이지 내의 'false' 텍스트를 제거하는 함수
    function removeFalseText() {
        // 모든 요소 검사
        const elements = document.querySelectorAll('*');
        elements.forEach(elem => {
            if (elem.childNodes.length === 1 && 
                elem.childNodes[0].nodeType === 3 && 
                elem.textContent.trim() === 'false') {
                elem.style.display = 'none';
            }
        });
        
        // 특별히 meal-info 내부의 텍스트 노드 검사
        const mealInfoDiv = document.querySelector('.meal-info');
        if (mealInfoDiv) {
            for (let i = 0; i < mealInfoDiv.childNodes.length; i++) {
                const node = mealInfoDiv.childNodes[i];
                if (node.nodeType === 3 && node.textContent.trim() === 'false') {
                    node.textContent = '';
                }
            }
        }
    }
    
    // YYYY-MM-DD 형식의 날짜를 표시 형식으로 변환하는 함수
    function formatDisplayDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
    }
    
    // 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // 페이지 로드 후 약간의 지연을 두고 false 텍스트 제거
    setTimeout(removeFalseText, 500);
});

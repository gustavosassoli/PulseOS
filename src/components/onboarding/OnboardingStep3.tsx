interface Props {
  wakeUpTime: string;
  onChangeWakeUpTime: (value: string) => void;
  sleepTime: string;
  onChangeSleepTime: (value: string) => void;
  mealsPerDay: number;
  onChangeMealsPerDay: (value: number) => void;
  workoutsPerWeek: number;
  onChangeWorkoutsPerWeek: (value: number) => void;
}

export default function OnboardingStep3({
  wakeUpTime,
  onChangeWakeUpTime,
  sleepTime,
  onChangeSleepTime,
  mealsPerDay,
  onChangeMealsPerDay,
  workoutsPerWeek,
  onChangeWorkoutsPerWeek,
}: Props) {
  const mealOptions = [2, 3, 4, 5, 6];
  const workoutOptions = [2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col py-2 px-1 max-w-sm mx-auto w-full h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white leading-tight font-sans tracking-tight">
          Como é a sua rotina?
        </h2>
        <p className="text-[#B9CBB9] text-[14px] font-medium mt-2">
          Usaremos isso para organizar sua agenda
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Wake Up Time */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Geralmente acordo às
          </label>
          <input
            type="time"
            value={wakeUpTime}
            onChange={(e) => onChangeWakeUpTime(e.target.value)}
            className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 px-5 text-white outline-none transition-colors font-medium h-[52px]"
          />
        </div>

        {/* Sleep Time */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Geralmente durmo às
          </label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => onChangeSleepTime(e.target.value)}
            className="w-full bg-[#1C1B1B] border border-[#3B4B3D] focus:border-[#00FF88] rounded-xl py-3 px-5 text-white outline-none transition-colors font-medium h-[52px]"
          />
        </div>

        {/* Meals per Day */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Faço em média (refeições/dia)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {mealOptions.map((opt) => {
              const isSelected = mealsPerDay === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => onChangeMealsPerDay(opt)}
                  className={`py-3 rounded-xl font-bold text-[14px] transition-all cursor-pointer h-[48px] ${
                    isSelected
                      ? 'bg-[#00FF88] text-[#003919] ring-2 ring-[#00FF88]/20'
                      : 'bg-[#1C1B1B] text-[#B9CBB9] border border-[#3B4B3D] hover:border-[#B9CBB9]/30'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workouts per Week */}
        <div className="flex flex-col text-left">
          <label className="text-xs font-bold text-[#B9CBB9] uppercase tracking-widest mb-2 ml-1">
            Quero treinar (vezes/semana)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {workoutOptions.map((opt) => {
              const isSelected = workoutsPerWeek === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => onChangeWorkoutsPerWeek(opt)}
                  className={`py-3 rounded-xl font-bold text-[14px] transition-all cursor-pointer h-[48px] ${
                    isSelected
                      ? 'bg-[#00FF88] text-[#003919] ring-2 ring-[#00FF88]/20'
                      : 'bg-[#1C1B1B] text-[#B9CBB9] border border-[#3B4B3D] hover:border-[#B9CBB9]/30'
                  }`}
                >
                  {opt}x
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

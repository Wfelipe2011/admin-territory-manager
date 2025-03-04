"use client";

import { SearchInterface } from "@/components/SearchInterface";
import { RoundChart } from "@/components/RoundChart";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { DialogTextConfirm } from "@/components/DialogTextConfirm";
import { AxiosAdapter } from "@/infra/AxiosAdapter";
import { MODE, RootModeScreen } from "@/components/RootModeScreen";
import { CreateRoundDto } from "@/types/CreateRoundDto";
import toast from "react-hot-toast";
import { PageTitle } from "@/components/ui/PageTitle";

type Round = {
  id: number;
  round_number: number;
  type: string;
  name: string;
  theme: string;
  tenant_id: number;
  color_primary: string;
  color_secondary: string;
  start_date: string;
  end_date: string | null;
  completed: number;
  not_completed: number;
};

const axios = new AxiosAdapter();
const ClientSideGestao = () => {
  const [mode, setMode] = useState<MODE>(MODE.LOADING);
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [dialogStatus, setDialogStatus] = useState(false);
  const [dialogRound, setDialogRound] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleDateSearch = (date: string, roundDate: string | null) => {
    if (!roundDate) return false;
    if (!date.includes("/")) return false;

    const [day, month, year] = date.split("/");
    const today = dayjs();

    const searchDay = day || today.format("DD");
    const searchMonth = month || today.format("MM");
    const searchYear = year || today.format("YYYY");

    const searchDate = dayjs(
      `${searchYear}-${searchMonth}-${searchDay}`
    ).toDate();

    const formattedRoundDate = new Date(roundDate);
    return formattedRoundDate >= searchDate;
  };

  const handleCompositeSearch = (searchValue: string, round: Round) => {
    const searchTerms = searchValue.split("+").map((term) => term.trim());
    return searchTerms.every(
      (term) =>
        round.name.toLowerCase().includes(term.toLowerCase()) ||
        handleDateSearch(term, round.start_date) ||
        handleDateSearch(term, round.end_date)
    );
  };

  async function fetchData() {
    setMode(MODE.LOADING)
    const axios = new AxiosAdapter()
    const response = await axios.get('rounds/info');
    setRounds(response.data as Round[]);
    setMode(MODE.SCREEN)
  }

  const filteredRounds = rounds
    ?.filter((round) => handleCompositeSearch(searchValue, round))
    .sort((a, b) =>
      a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0
    )
    .sort((a, _b) => (a.end_date === null ? -1 : 1));

  const handleButtonClick = async (params: CreateRoundDto) => {
    try {
      setMode(MODE.LOADING)
      await axios.post(`rounds/start`, params);
      toast.success("Rodada iniciada com sucesso");
      fetchData()
    } catch (error) {
      toast.error("Erro ao iniciar rodada");
      console.log(error);
    }
  };

  const handleArchClick = async () => {
    setMode(MODE.LOADING)
    await axios.post(`rounds/finish`, {
      roundNumber: dialogRound,
    });
    setDialogStatus(false);
    setDialogRound(0);
    fetchData()
  };

  useEffect(() => {
    fetchData()
  }, []);

  return (
    <RootModeScreen mode={mode}>
      <PageTitle title="Gestão de Rodadas" />

      <SearchInterface
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onButtonClick={handleButtonClick}
      />

      <div className="flex flex-wrap justify-center gap-6 py-8">
        {filteredRounds?.map((round) => (
          <RoundChart
            key={round.id}
            data={[
              { name: "Concluído", value: round.completed },
              { name: "A fazer", value: round.not_completed },
            ]}
            colors={[round.color_primary, round.color_secondary]}
            start_date={new Date(round.start_date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
            end_date={
              round.end_date === null
                ? null
                : new Date(round.end_date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
            }
            title={`${round.round_number} - ${round.name}`}
            type={round.type}
            theme={round.theme}
            id={round.id}
            onEditClick={() =>
              router.push(`/territories/${round.round_number}`)
            }
            onArchClick={() => {
              setDialogStatus(true);
              setDialogRound(round.round_number);
            }}
          />
        ))}
      </div>
      <DialogTextConfirm
        status={dialogStatus}
        onStatusChange={setDialogStatus}
        onLeafClick={handleArchClick}
        onRightClick={() => {
          console.log("Botão 'Cancelar' clicado!");
          setDialogStatus(false);
          setDialogRound(0);
        }}
      >
        <p className="text-lg font-medium">Deseja arquivar este território?</p>
      </DialogTextConfirm>
    </RootModeScreen>
  )
};

export default ClientSideGestao;

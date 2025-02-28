"use client";

import { SearchInterface } from "@/components/SearchInterface";
import { RoundChart } from "@/components/RoundChart";
import { useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { DialogTextConfirm } from "@/components/DialogTextConfirm";
import { AxiosAdapter } from "@/infra/AxiosAdapter";

type Round = {
  id: number;
  round_number: number;
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

type ClientSideGestaoProps = {
  rounds: Round[];
};
const axios = new AxiosAdapter();
const ClientSideGestao = ({ rounds }: ClientSideGestaoProps) => {
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

  const filteredRounds = rounds
    ?.filter((round) => handleCompositeSearch(searchValue, round))
    .sort((a, b) =>
      a.start_date < b.start_date ? 1 : a.start_date > b.start_date ? -1 : 0
    );

  const handleButtonClick = async ({
    name,
    theme,
  }: {
    name: string;
    theme: string;
  }) => {
    await axios.post(`rounds/start`, {
      name,
      theme,
    });
    router.refresh();
  };

  const handleArchClick = async () => {
    await axios.post(`rounds/finish`, {
      roundNumber: dialogRound,
    });
    setDialogStatus(false);
    setDialogRound(0);
    router.refresh();
  };

  if (!rounds?.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium">Nenhum território cadastrado</p>
      </div>
    )
  }

  return (
    <div className="md:px-6">
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
            title={round.name}
            id={round.id}
            onEditClick={() =>
              router.push(`/territories/${round.round_number}`)
            }
            onArchClick={() => {
              console.log("Botão 'Arquivar' clicado!", round.round_number);
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
    </div>
  )
};

export default ClientSideGestao;
